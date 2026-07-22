import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { CopilotDrawer } from './CopilotDrawer'
import { Sparkles } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeNavItem?: string
  onNavigate?: (itemId: string) => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeNavItem,
  onNavigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [isCopilotOpen, setIsCopilotOpen] = React.useState(false)

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  // Use connection ID 1 as default connection workspace in local cockpit view
  const connectionId = 1

  return (
    <div className="flex h-screen bg-white dark:bg-neutral-900 relative">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem={activeNavItem}
        onNavigate={onNavigate}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onMenuToggle={(open) => setIsSidebarOpen(open)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container-lg py-lg">
            {children}
          </div>
        </main>
      </div>

      {/* Floating AI Copilot Trigger Button */}
      <button
        onClick={() => setIsCopilotOpen(!isCopilotOpen)}
        className="fixed bottom-6 right-6 z-40 bg-sky-600 hover:bg-sky-500 text-white rounded-full px-4 py-3 shadow-elevation-3 transition-all duration-300 hover:scale-105 flex items-center gap-2 font-bold text-xs"
        aria-label="Open AI Copilot Drawer"
      >
        <Sparkles className="h-4.5 w-4.5 animate-pulse" />
        <span className="hidden sm:inline">AI Copilot</span>
      </button>

      {/* Slide-out Remediation Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        connectionId={connectionId}
      />
    </div>
  )
}
