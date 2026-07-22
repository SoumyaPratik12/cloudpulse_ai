import React from 'react'
import { Sparkles, Send, X, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

interface Message {
  sender: 'user' | 'ai'
  text: string
  proposedAction?: {
    id: number
    tool_name: string
    parameters: any
    description: string
  } | null
  executionStatus?: 'pending' | 'loading' | 'confirmed' | 'rejected' | 'failed'
  executionResult?: string
}

interface CopilotDrawerProps {
  isOpen: boolean
  onClose: () => void
  connectionId: number
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose, connectionId }) => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I'm your Remediation AI Copilot. I scan config policies and trace drifted resources in real time. Ask me to 'fix s3 versioning' or 'close public port 22'!"
    }
  ])
  const [inputText, setInputText] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!isOpen) return null

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const userMsg = inputText
    setInputText('')
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setLoading(true)

    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/v1/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          connection_id: connectionId,
          message: userMsg
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: data.message,
          proposedAction: data.proposed_action,
          executionStatus: data.proposed_action ? 'pending' : undefined
        }])
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: 'Error communicating with copilot diagnostics.' }])
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${err.message || 'Connection failed.'}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (actionId: number, decision: 'confirmed' | 'rejected', msgIndex: number) => {
    // Set status to loading
    setMessages(prev => prev.map((m, idx) => idx === msgIndex ? { ...m, executionStatus: 'loading' } : m))

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/v1/copilot/actions/${actionId}/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      })

      const data = await res.json()
      if (res.ok) {
        setMessages(prev => prev.map((m, idx) => idx === msgIndex ? {
          ...m,
          executionStatus: decision,
          executionResult: decision === 'confirmed' ? (data.result || 'Executed successfully!') : 'Action discarded.'
        } : m))
      } else {
        setMessages(prev => prev.map((m, idx) => idx === msgIndex ? {
          ...m,
          executionStatus: 'failed',
          executionResult: data.detail || 'Execution failed.'
        } : m))
      }
    } catch (err: any) {
      setMessages(prev => prev.map((m, idx) => idx === msgIndex ? {
        ...m,
        executionStatus: 'failed',
        executionResult: err.message || 'Connection failed.'
      } : m))
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white dark:bg-neutral-800 shadow-2xl border-l border-slate-200 dark:border-neutral-750 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-neutral-700 flex items-center justify-between bg-slate-50 dark:bg-neutral-750/30">
        <div className="flex items-center gap-2">
          <div className="bg-sky-500/10 text-sky-600 dark:text-sky-400 p-1.5 rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-body-md font-bold text-neutral-900 dark:text-white leading-none">Remediation Copilot</h3>
            <span className="text-[10px] text-sky-500 font-medium">SecOps Diagnostics</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-md transition-smooth">
          <X className="h-4 w-4 text-slate-500 dark:text-neutral-400" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
              m.sender === 'user'
                ? 'bg-sky-600 text-white rounded-tr-none'
                : 'bg-slate-100 dark:bg-neutral-800 dark:border dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-tl-none'
            }`}>
              <p className="leading-relaxed">{m.text}</p>
            </div>

            {/* Proposed Action Card */}
            {m.proposedAction && (
              <div className="w-[90%] mt-3 border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Proposed Resolution</span>
                </div>
                
                <p className="text-[11px] text-slate-600 dark:text-neutral-300 leading-relaxed font-semibold">
                  {m.proposedAction.description}
                </p>

                <div className="bg-white/80 dark:bg-neutral-800/40 border border-slate-100 dark:border-neutral-700 p-2.5 rounded-lg">
                  <span className="text-[9px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider font-bold block mb-1">Parameters:</span>
                  <pre className="text-[10px] font-mono text-slate-700 dark:text-neutral-300 overflow-x-auto">
                    {JSON.stringify(m.proposedAction.parameters, null, 2)}
                  </pre>
                </div>

                {m.executionStatus === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDecision(m.proposedAction!.id, 'confirmed', idx)}
                      className="flex-1 text-center py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Approve & Execute
                    </button>
                    <button
                      onClick={() => handleDecision(m.proposedAction!.id, 'rejected', idx)}
                      className="px-3 text-center py-1.5 rounded-lg bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {m.executionStatus === 'loading' && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-sky-600 dark:text-sky-400 font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing AWS API Remediation...</span>
                  </div>
                )}

                {m.executionStatus === 'confirmed' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approved & Successfully Applied!</span>
                    </div>
                    {m.executionResult && (
                      <pre className="text-[9px] bg-slate-100 dark:bg-neutral-800 p-2 rounded border border-slate-200 dark:border-neutral-700 font-mono text-slate-600 dark:text-neutral-400 overflow-x-auto whitespace-pre-wrap">
                        {m.executionResult}
                      </pre>
                    )}
                  </div>
                )}

                {m.executionStatus === 'rejected' && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Action Discarded by Operator</span>
                  </div>
                )}

                {m.executionStatus === 'failed' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-[11px] font-bold">
                      <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                      <span>Remediation Run Failed</span>
                    </div>
                    {m.executionResult && (
                      <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900/30">
                        {m.executionResult}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 dark:text-neutral-500 text-xs italic">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Copilot is diagnosing configuration states...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-neutral-700 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask diagnostics or request drift fix..."
          className="flex-1 bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-neutral-200 placeholder-slate-400 outline-none focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-sm"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
