import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { 
  Cpu, 
  HardDrive, 
  Database, 
  Network, 
  BarChart3, 
  DollarSign, 
  ShieldAlert, 
  Play, 
  Check, 
  Loader2,
  AlertTriangle,
  Terminal as TerminalIcon,
  RotateCcw
} from 'lucide-react'

interface CatalogModule {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  setupTime: string
  iconColor: string
}

interface DAGNode {
  id: string
  label: string
  status: 'pending' | 'creating' | 'completed' | 'failed'
  dependsOn: string[]
}

const CATALOG_MODULES: CatalogModule[] = [
  {
    id: 'compute',
    title: 'Compute',
    description: 'Deploy and manage EC2 instances, containers, and serverless workloads.',
    icon: <Cpu className="h-6 w-6" />,
    setupTime: '2 min',
    iconColor: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40',
  },
  {
    id: 'storage',
    title: 'Storage',
    description: 'Manage S3 buckets, lifecycle policies, and object storage.',
    icon: <HardDrive className="h-6 w-6" />,
    setupTime: '1 min',
    iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    id: 'database',
    title: 'Database',
    description: 'Provision relational and NoSQL databases with automated backups.',
    icon: <Database className="h-6 w-6" />,
    setupTime: '3 min',
    iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    id: 'networking',
    title: 'Networking',
    description: 'Configure VPCs, load balancers, DNS, routing, and gateways.',
    icon: <Network className="h-6 w-6" />,
    setupTime: '4 min',
    iconColor: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'AI-powered infrastructure insights, monitoring, forecasting, and optimization.',
    icon: <BarChart3 className="h-6 w-6" />,
    setupTime: '5 min',
    iconColor: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
  },
  {
    id: 'billing',
    title: 'Billing',
    description: 'Cost tracking, budget planning, usage analysis, and forecasting.',
    icon: <DollarSign className="h-6 w-6" />,
    setupTime: '1 min',
    iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    id: 'security',
    title: 'Team Security',
    description: 'Identity management, RBAC, compliance, and governance controls.',
    icon: <ShieldAlert className="h-6 w-6" />,
    setupTime: '3 min',
    iconColor: 'text-red-500 bg-red-50 dark:bg-red-950/40',
  },
]

export const CatalogPage: React.FC = () => {
  const [provisioned, setProvisioned] = React.useState<string[]>([])
  const [provisioningId, setProvisioningId] = React.useState<string | null>(null)
  
  // DAG States
  const [nodes, setNodes] = React.useState<DAGNode[]>([])
  const [logs, setLogs] = React.useState<string[]>([])
  const [hasError, setHasError] = React.useState(false)
  const [errorNodeId, setErrorNodeId] = React.useState<string | null>(null)
  const [isFinished, setIsFinished] = React.useState(false)

  const terminalRef = React.useRef<HTMLDivElement>(null)

  // Load provisioned modules on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('provisioned_modules')
    if (saved) {
      setProvisioned(JSON.parse(saved))
    }
  }, [])

  // Auto-scroll terminal
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const initialNodes = (moduleName: string): DAGNode[] => [
    { id: 'vpc', label: 'AWS VPC (VpcId)', status: 'pending', dependsOn: [] },
    { id: 'iam', label: 'IAM Roles / Policies', status: 'pending', dependsOn: [] },
    { id: 'subnets', label: 'VPC Subnets', status: 'pending', dependsOn: ['vpc'] },
    { id: 'sg', label: 'Security Group', status: 'pending', dependsOn: ['subnets'] },
    { id: 'resource', label: `Target: aws_${moduleName}`, status: 'pending', dependsOn: ['sg', 'iam'] }
  ]

  const startOrResumeProvisioning = (id: string, isRetry: boolean = false) => {
    setProvisioningId(id)
    setHasError(false)
    setIsFinished(false)

    let currentNodes = isRetry ? [...nodes] : initialNodes(id)
    if (isRetry && errorNodeId) {
      currentNodes = currentNodes.map(n => n.id === errorNodeId ? { ...n, status: 'pending' } : n)
      setErrorNodeId(null)
    }
    setNodes(currentNodes)

    if (!isRetry) {
      setLogs([
        `[Terraform] Initializing provider plugins...`,
        `[Terraform] Finding aws-provider version 5.0+...`,
        `[Terraform] Terraform initialized successfully.`,
        `[Terraform] Planning deployment for module: ${id}...`,
        `[Terraform] Plan: 5 to add, 0 to change, 0 to destroy.`
      ])
    } else {
      setLogs(prev => [...prev, `\n[Terraform] Resuming apply sequence...`])
    }

    let interval: any = null
    let ticks = 0

    interval = setInterval(() => {
      ticks++
      setNodes(prevNodes => {
        // Find which nodes can transition to creating
        const nextNodes = prevNodes.map(node => {
          if (node.status === 'pending') {
            const depsMet = node.dependsOn.every(depId => 
              prevNodes.find(n => n.id === depId)?.status === 'completed'
            )
            if (depsMet) {
              setLogs(prevLogs => [...prevLogs, `[Terraform] ${node.label}: Creating...`])
              return { ...node, status: 'creating' as const }
            }
          }
          return node
        })

        // Simulate nodes finishing creation
        const updatedNodes = nextNodes.map(node => {
          if (node.status === 'creating') {
            // Introduce a simulated transient failure on the 'sg' node (Security Group rule conflict)
            if (node.id === 'sg' && Math.random() < 0.35 && !isRetry) {
              clearInterval(interval)
              setHasError(true)
              setErrorNodeId(node.id)
              setLogs(prevLogs => [
                ...prevLogs,
                `[Terraform] ERROR: aws_security_group.allow_tls: IP range conflict. Port 443 already bound in VPC scope.`,
                `[Terraform] Error: Apply failed. Resource state locked.`
              ])
              return { ...node, status: 'failed' as const }
            }

            // Otherwise, complete normally
            setLogs(prevLogs => [...prevLogs, `[Terraform] ${node.label}: Creation complete!`])
            return { ...node, status: 'completed' as const }
          }
          return node
        })

        // Check if finished
        const allCompleted = updatedNodes.every(n => n.status === 'completed')
        if (allCompleted) {
          clearInterval(interval)
          setIsFinished(true)
          setLogs(prevLogs => [
            ...prevLogs,
            `\n[Terraform] Apply complete! Resources: 5 added, 0 changed, 0 destroyed.`,
            `[CloudPulse] Module ${id.toUpperCase()} successfully initialized.`
          ])
          
          // Save and notify
          const updated = [...provisioned, id]
          setProvisioned(updated)
          localStorage.setItem('provisioned_modules', JSON.stringify(updated))
          window.dispatchEvent(new Event('provisioned_modules_changed'))
        }

        return updatedNodes
      })
    }, 1200)
  }

  const handleCloseModal = () => {
    setProvisioningId(null)
    setNodes([])
    setLogs([])
    setHasError(false)
    setIsFinished(false)
  }

  return (
    <DashboardLayout activeNavItem="catalog">
      <div className="space-y-lg">
        {/* Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-2xl p-lg shadow-elevation-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
          <div className="max-w-xl space-y-sm relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">CloudPulse AI Module Catalog</h1>
            <p className="text-sky-100 text-body-md">
              Provision dynamically connected infrastructure capabilities. Deployed modules will build resources in parallel and resolve dependencies before unlocking live telemetry dashboards.
            </p>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {CATALOG_MODULES.map((module) => {
            const isActive = provisioned.includes(module.id)
            const isProvisioning = provisioningId === module.id

            return (
              <Card 
                key={module.id} 
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-elevation-2 ${
                  isActive 
                    ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10' 
                    : isProvisioning 
                      ? 'border-sky-500/30 ring-2 ring-sky-500/10' 
                      : 'border-slate-100 dark:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-md">
                    <div className={`p-3 rounded-xl ${module.iconColor}`}>
                      {module.icon}
                    </div>
                    <div>
                      {isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Available</Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-h3 font-bold text-neutral-800 dark:text-neutral-100 mb-sm">{module.title}</h3>
                  <p className="text-body-sm text-neutral-600 dark:text-neutral-400 mb-lg min-h-[40px]">
                    {module.description}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-700/60 pt-md mt-md">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-md">
                    <span>Est. setup time: <strong>{module.setupTime}</strong></span>
                    {isActive && <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>}
                  </div>

                  {isActive ? (
                    <Button 
                      variant="secondary" 
                      className="w-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default hover:bg-emerald-50"
                      icon={<Check className="h-4 w-4" />}
                    >
                      Provisioned
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                      icon={<Play className="h-4 w-4 fill-current" />}
                      onClick={() => startOrResumeProvisioning(module.id)}
                      disabled={!!provisioningId}
                    >
                      Provision Module
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* CloudFormation/Terraform Dependency Orchestration Modal */}
      {provisioningId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 p-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    CloudFormation Orchestrator (Terraform Apply)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Deploying module: <code className="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-sky-600">{provisioningId}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Dependency DAG Visualization */}
            <div className="p-lg bg-slate-50 dark:bg-neutral-900/50 flex flex-col items-center justify-center border-b border-neutral-100 dark:border-neutral-700/60 min-h-[220px]">
              <span className="text-xs font-semibold text-neutral-400 mb-lg uppercase tracking-wider">Dependency Execution Graph</span>
              
              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 max-w-full">
                {nodes.map((node, index) => {
                  const nodeColor = 
                    node.status === 'completed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' :
                    node.status === 'creating' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 ring-2 ring-sky-500/20 animate-pulse' :
                    node.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 ring-2 ring-red-500/25' :
                    'border-neutral-200 bg-white dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'

                  return (
                    <React.Fragment key={node.id}>
                      <div className={`relative flex items-center justify-center px-4 py-2 border rounded-xl shadow-sm text-xs font-bold font-mono transition-all duration-300 ${nodeColor}`}>
                        {node.status === 'creating' && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                        {node.status === 'completed' && <Check className="h-3 w-3 mr-1.5" />}
                        {node.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1.5" />}
                        {node.label}
                      </div>

                      {/* Display dependency arrows */}
                      {index < nodes.length - 1 && (
                        <div className="hidden sm:flex text-neutral-300 dark:text-neutral-700 font-bold">➜</div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="flex-1 p-lg bg-neutral-950 text-green-400 font-mono text-xs overflow-y-auto min-h-[180px] max-h-[300px]" ref={terminalRef}>
              <div className="flex items-center gap-1.5 text-neutral-400 border-b border-neutral-800 pb-2 mb-2 font-sans font-semibold">
                <TerminalIcon className="h-4 w-4" />
                <span>Console Output</span>
              </div>
              {logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed py-0.5">{log}</div>
              ))}
            </div>

            {/* Footer / Controls */}
            <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-700/60 p-lg">
              {hasError ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-red-500 flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Apply failed due to dependency rule conflict.
                  </span>
                  <Button 
                    variant="primary" 
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    icon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => startOrResumeProvisioning(provisioningId, true)}
                  >
                    Resolve & Retry
                  </Button>
                </div>
              ) : isFinished ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> Infrastructure successfully provisioned!
                  </span>
                  <Button 
                    variant="primary" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={handleCloseModal}
                  >
                    Launch Dashboard
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-neutral-500">Creating parallel AWS assets...</span>
                  <Button variant="secondary" disabled className="cursor-not-allowed text-neutral-400">
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Applying
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
