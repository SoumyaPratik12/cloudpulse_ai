import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Cloud, 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  HardDrive, 
  Database, 
  Network, 
  BarChart3, 
  DollarSign, 
  Settings, 
  HelpCircle, 
  ChevronDown 
} from 'lucide-react'

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

const mainNavigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/dashboard',
  },
  {
    id: 'saas-apps',
    label: 'SaaS Applications',
    icon: <Layers className="h-5 w-5" />,
    subitems: [
      { id: 'app-ecommerce', label: 'E-commerce Platform', href: '/resources' },
      { id: 'app-hr', label: 'HR Portal', href: '/resources' },
    ],
  },
]

const serviceNavigationItems: NavItem[] = [
  {
    id: 'compute',
    label: 'Compute',
    icon: <Cpu className="h-5 w-5" />,
    href: '/resources',
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: <HardDrive className="h-5 w-5" />,
    href: '/resources',
  },
  {
    id: 'database',
    label: 'Database',
    icon: <Database className="h-5 w-5" />,
    href: '/resources',
  },
  {
    id: 'networking',
    label: 'Networking',
    icon: <Network className="h-5 w-5" />,
    href: '/resources',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/dashboard',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <DollarSign className="h-5 w-5" />,
    href: '/cost-analysis',
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
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set(['saas-apps']))

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const renderItemButton = (item: NavItem) => {
    const isActive = activeItem === item.id || (item.subitems && item.subitems.some(sub => activeItem === sub.id))
    return (
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
          w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-body-md transition-all duration-200
          ${isActive
            ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/20'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }
        `}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {item.subitems && (
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${expandedItems.has(item.id) ? 'rotate-180' : ''}`}
          />
        )}
      </button>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed md:relative left-0 top-0 z-40 h-screen w-64 bg-[#0f172a] text-white
          border-r border-slate-800 overflow-y-auto
          transition-transform duration-300 ease-in-out md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Logo header */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
          <Cloud className="h-7 w-7 text-sky-400" />
          <span className="text-xl font-bold tracking-tight text-white">CloudWare</span>
        </div>

        <nav className="p-4 space-y-6">
          {/* Main Group */}
          <div className="space-y-1">
            {mainNavigationItems.map((item) => (
              <div key={item.id} className="space-y-1">
                {renderItemButton(item)}
                
                {/* Subitems */}
                {item.subitems && expandedItems.has(item.id) && (
                  <div className="ml-6 pl-4 border-l border-slate-800 space-y-1 mt-1">
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
                          w-full text-left px-3 py-1.5 rounded-md text-body-sm transition-colors duration-200
                          ${activeItem === subitem.id
                            ? 'text-sky-400 font-medium'
                            : 'text-slate-400 hover:text-slate-200'
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
          </div>

          {/* Services Group */}
          <div className="space-y-2">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Services
            </h3>
            <div className="space-y-1">
              {serviceNavigationItems.map((item) => (
                <div key={item.id}>
                  {renderItemButton(item)}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Support section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-[#0b0f19]">
          <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-body-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
            <HelpCircle className="h-5 w-5 text-slate-400" />
            <span>Help & Support</span>
          </button>
        </div>
      </aside>
    </>
  )
}
