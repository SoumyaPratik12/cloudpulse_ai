import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Settings, DollarSign, Zap, LifeBuoy, HelpCircle, ChevronDown } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  subitems?: NavItem[]
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  activeItem?: string
  onNavigate?: (itemId: string) => void
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/dashboard',
    subitems: [
      { id: 'executive', label: 'Executive Dashboard', href: '/dashboard/executive' },
      { id: 'devops', label: 'DevOps Dashboard', href: '/dashboard/devops' },
      { id: 'finance', label: 'Finance Dashboard', href: '/dashboard/finance' },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: <Zap className="h-5 w-5" />,
    href: '/resources',
  },
  {
    id: 'cost-analysis',
    label: 'Cost Analysis',
    icon: <DollarSign className="h-5 w-5" />,
    href: '/cost-analysis',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: <LifeBuoy className="h-5 w-5" />,
    href: '/alerts',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings',
  },
]

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose,
  activeItem,
  onNavigate,
}) => {
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-neutral-800
          border-r border-neutral-200 dark:border-neutral-700
          overflow-y-auto
          transition-transform duration-300 md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <nav className="p-4 pt-6">
          {navigationItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  onNavigate?.(item.id)
                  if (item.href) {
                    navigate(item.href)
                  }
                  if (item.subitems) {
                    toggleExpanded(item.id)
                  }
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md text-body-md
                  transition-smooth
                  ${activeItem === item.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }
                `}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.subitems && (
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${expandedItems.has(item.id) ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Subitems */}
              {item.subitems && expandedItems.has(item.id) && (
                <div className="ml-3 mt-1 space-y-1">
                  {item.subitems.map((subitem) => (
                    <button
                      key={subitem.id}
                      onClick={() => {
                        onNavigate?.(subitem.id)
                        if (subitem.href) {
                          navigate(subitem.href)
                        }
                      }}
                      className={`
                        w-full text-left px-3 py-1.5 rounded-md text-body-sm
                        transition-smooth
                        ${activeItem === subitem.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        }
                      `}
                    >
                      {subitem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Help section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-body-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-smooth">
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </button>
        </div>
      </aside>
    </>
  )
}
