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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden md:flex items-center bg-slate-100 dark:bg-neutral-700/50 rounded-lg px-3 py-1.5 gap-2 border border-slate-200 dark:border-neutral-700">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search resources, logs..." 
            className="bg-transparent border-none outline-none text-body-sm text-slate-600 dark:text-neutral-200 w-full placeholder-slate-400"
          />
        </div>
        <div className="md:hidden flex items-center gap-2">
          <Cloud className="h-6 w-6 text-sky-500" />
          <span className="text-body-lg font-bold text-neutral-900 dark:text-white">CloudPulse</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-smooth">
            <Bell className="h-5 w-5 text-neutral-600 dark:text-slate-300" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-800" />
          </button>

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
              onClick={() => setIsProfileOpen(!isProfileOpen)}
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
