import React from 'react'
import { Cloud, Settings, LogOut, Moon, Sun, Menu, X, Search, Bell } from 'lucide-react'
import { Avatar } from './Avatar'

interface HeaderProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
  onLogout?: () => void
  onSettings?: () => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
  onMenuToggle?: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Ava Wilson',
  userEmail = 'ava@cloudpulse.ai',
  userAvatar: _userAvatar,
  onLogout,
  onSettings,
  isDarkMode = false,
  onToggleDarkMode,
  onMenuToggle,
}) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState([
    { id: 1, text: 'VPC network changes deployed successfully via Terraform.', time: '10m ago', unread: true },
    { id: 2, text: 'CRITICAL Security SG: Port 22 SSH exposure warning detected.', time: '1h ago', unread: true },
    { id: 3, text: 'Monthly AWS spend forecast reaches 82% of budget target.', time: '4h ago', unread: false },
  ])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'simulation' | 'live'>(() => {
    return (localStorage.getItem('cloudpulse_mode') as 'simulation' | 'live') || 'simulation'
  })
  const [connections, setConnections] = React.useState<any[]>([])
  const [selectedConnection, setSelectedConnection] = React.useState<any>(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false)

  const fetchConnections = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/v1/connections', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setConnections(data)
        if (data.length > 0) {
          const stored = localStorage.getItem('cloudpulse_connection_id')
          const found = data.find((c: any) => c.id.toString() === stored)
          const active = found || data[0]
          setSelectedConnection(active)
          localStorage.setItem('cloudpulse_connection_id', active.id.toString())
        }
      }
    } catch (err) {
      console.error('Failed to load accounts list', err)
    }
  }

  React.useEffect(() => {
    fetchConnections()
    const handleAccountChange = () => {
      fetchConnections()
    }
    window.addEventListener('cloudpulse_account_changed', handleAccountChange)
    return () => window.removeEventListener('cloudpulse_account_changed', handleAccountChange)
  }, [])

  const toggleMode = () => {
    const newMode = mode === 'simulation' ? 'live' : 'simulation'
    setMode(newMode)
    localStorage.setItem('cloudpulse_mode', newMode)
    window.dispatchEvent(new Event('cloudpulse_mode_changed'))
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side: Search Bar & Mode Toggle */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-md hidden md:flex items-center bg-slate-100 dark:bg-neutral-700/50 rounded-lg px-3 py-1.5 gap-2 border border-slate-200 dark:border-neutral-700">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search resources, logs..." 
              className="bg-transparent border-none outline-none text-body-sm text-slate-600 dark:text-neutral-200 w-full placeholder-slate-400"
            />
          </div>
          <button
            onClick={toggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 shadow-sm border ${
              mode === 'simulation'
                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${mode === 'simulation' ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
            {mode === 'simulation' ? 'Simulation Mode' : 'Live AWS Connected'}
          </button>

          {/* AWS Account Switcher */}
          {connections.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-all shadow-sm"
              >
                <span>AWS: {selectedConnection ? selectedConnection.role_arn.split('::')[1]?.split(':')[0] || `Account ${selectedConnection.id}` : 'Connecting...'}</span>
                <span className="text-[9px] text-slate-400">({selectedConnection?.region || 'Global'})</span>
              </button>
              
              {isAccountMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-neutral-800 shadow-lg border border-slate-200 dark:border-neutral-700 overflow-hidden z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-750/30">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Switch AWS Account Workspace</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-neutral-700 max-h-48 overflow-y-auto">
                    {connections.map(c => {
                      const accountId = c.role_arn.split('::')[1]?.split(':')[0] || `Account ID: ${c.id}`;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedConnection(c)
                            localStorage.setItem('cloudpulse_connection_id', c.id.toString())
                            setIsAccountMenuOpen(false)
                            window.dispatchEvent(new Event('cloudpulse_account_changed'))
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-neutral-700/60 transition-colors flex flex-col ${selectedConnection?.id === c.id ? 'bg-sky-500/5 text-sky-600 dark:text-sky-400 font-semibold' : 'text-slate-700 dark:text-neutral-300'}`}
                        >
                          <span>{accountId}</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">Region: {c.region} ({c.status})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="md:hidden flex items-center gap-2">
          <Cloud className="h-6 w-6 text-sky-500" />
          <span className="text-body-lg font-bold text-neutral-900 dark:text-white">CloudPulse</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setIsProfileOpen(false)
              }}
              className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-smooth"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5 text-neutral-600 dark:text-slate-300" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-800" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-750 overflow-hidden animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-slate-50 dark:bg-neutral-750/30">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Alert Center</span>
                  {notifications.some(n => n.unread) && (
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                      className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-700">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400 italic">No notifications active.</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                        className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer text-left ${n.unread ? 'bg-sky-500/5 dark:bg-sky-500/10' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[11px] leading-relaxed ${n.unread ? 'text-neutral-800 dark:text-neutral-200 font-semibold' : 'text-slate-500 dark:text-neutral-400'}`}>
                            {n.text}
                          </span>
                          {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0 mt-1" />}
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-neutral-500 font-medium block mt-1">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-smooth"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-neutral-600 dark:text-slate-300" />
            ) : (
              <Moon className="h-5 w-5 text-neutral-600 dark:text-slate-300" />
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-body-sm font-semibold text-neutral-800 dark:text-neutral-200">Ava</span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Ava Wilson - CEO/Admin</span>
            </div>
            
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen)
                setIsNotificationsOpen(false)
              }}
              className="flex items-center gap-2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-smooth"
            >
              <Avatar
                initials="AW"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                size="md"
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white dark:bg-neutral-700 shadow-elevation-3 overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-600">
                  <p className="text-body-md font-semibold text-neutral-900 dark:text-white">{userName}</p>
                  <p className="text-body-sm text-neutral-500 dark:text-neutral-400">{userEmail}</p>
                </div>
                <button
                  onClick={onSettings}
                  className="w-full text-left px-4 py-2 text-body-md hover:bg-neutral-100 dark:hover:bg-neutral-600 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-body-md text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen)
              onMenuToggle?.(!isMobileMenuOpen)
            }}
            className="md:hidden p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-smooth"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
