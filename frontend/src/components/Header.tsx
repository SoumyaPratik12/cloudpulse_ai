import React from 'react'
import { Cloud, Settings, LogOut, Moon, Sun, Menu, X } from 'lucide-react'
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
  userName = 'John Doe',
  userEmail = 'john@example.com',
  userAvatar,
  onLogout,
  onSettings,
  isDarkMode = false,
  onToggleDarkMode,
  onMenuToggle,
}) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-elevation-1">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-primary-600" />
          <span className="text-h4 font-bold text-neutral-900 dark:text-white">CloudPulse</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-smooth"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-neutral-600" />
            ) : (
              <Moon className="h-5 w-5 text-neutral-600" />
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-smooth"
            >
              <Avatar
                initials={userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
                src={userAvatar}
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
