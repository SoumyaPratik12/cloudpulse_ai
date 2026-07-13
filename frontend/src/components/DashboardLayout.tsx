import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

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

  return (
    <div className="flex h-screen bg-white dark:bg-neutral-900">
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
    </div>
  )
}
