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
  Loader2 
} from 'lucide-react'

interface CatalogModule {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  setupTime: string
  iconColor: string
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
  const [progress, setProgress] = React.useState(0)

  // Load provisioned modules on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('provisioned_modules')
    if (saved) {
      setProvisioned(JSON.parse(saved))
    }
  }, [])

  const handleProvision = (id: string) => {
    if (provisioned.includes(id) || provisioningId) return

    setProvisioningId(id)
    setProgress(0)

    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 250)

    // Complete provisioning after 3 seconds
    setTimeout(() => {
      clearInterval(interval)
      const updated = [...provisioned, id]
      setProvisioned(updated)
      localStorage.setItem('provisioned_modules', JSON.stringify(updated))
      // Dispatch custom event to notify sidebar instantly
      window.dispatchEvent(new Event('provisioned_modules_changed'))
      setProvisioningId(null)
      setProgress(0)
    }, 3000)
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
              Discover and provision dynamic multi-cloud management capabilities on-demand. Deployed modules immediately unlock operation panels, cost statistics, and SRE AI Copilot integrations.
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
                      ? 'border-sky-500/30 ring-2 ring-sky-500/10 animate-pulse' 
                      : 'border-slate-100 dark:border-neutral-700'
                }`}
              >
                <div>
                  {/* Top Details */}
                  <div className="flex items-start justify-between mb-md">
                    <div className={`p-3 rounded-xl ${module.iconColor}`}>
                      {module.icon}
                    </div>
                    <div>
                      {isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : isProvisioning ? (
                        <Badge variant="warning">Provisioning {progress}%</Badge>
                      ) : (
                        <Badge variant="neutral">Available</Badge>
                      )}
                    </div>
                  </div>

                  {/* Header & Desc */}
                  <h3 className="text-h3 font-bold text-neutral-800 dark:text-neutral-100 mb-sm">{module.title}</h3>
                  <p className="text-body-sm text-neutral-600 dark:text-neutral-400 mb-lg min-h-[40px]">
                    {module.description}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="border-t border-slate-100 dark:border-neutral-700/60 pt-md mt-md">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-md">
                    <span>Est. setup time: <strong>{module.setupTime}</strong></span>
                    {isActive && <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>}
                  </div>

                  {isProvisioning ? (
                    <div className="space-y-sm">
                      <div className="w-full bg-slate-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-500 h-full transition-all duration-300 ease-out" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <Button variant="secondary" className="w-full cursor-not-allowed justify-center" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Deploying...
                      </Button>
                    </div>
                  ) : isActive ? (
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
                      onClick={() => handleProvision(module.id)}
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
    </DashboardLayout>
  )
}
