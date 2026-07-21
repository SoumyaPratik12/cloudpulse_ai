import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { DashboardLayout } from '../components/DashboardLayout'
import { DataTable } from '../components/DataTable'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Badge } from '../components/Badge'
import { 
  RefreshCw, 
  Server, 
  Play, 
  Square, 
  RotateCw, 
  HardDrive, 
  ShieldCheck, 
  FileCheck, 
  Clock, 
  Cpu, 
  Upload, 
  Trash2,
  AlertTriangle,
  Database,
  Network,
  BarChart3,
  Terminal,
  Activity
} from 'lucide-react'

// Active Compute instances simulated state
interface ComputeInstance {
  id: string
  name: string
  type: string
  region: string
  cpu: number
  memory: number
  network: string
  uptime: string
  state: 'running' | 'stopping' | 'stopped' | 'starting' | 'rebooting'
  drifted?: boolean
  driftDetails?: string
}

// Active Storage bucket simulated state
interface StorageBucket {
  name: string
  region: string
  objectCount: number
  storageUsed: string
  monthlyCost: number
  encryption: string
  versioning: boolean
  lifecycle: string
  drifted?: boolean
  driftDetails?: string
}

// Active Database RDS instance state
interface DatabaseInstance {
  id: string
  name: string
  engine: string
  region: string
  connections: number
  size: string
  state: 'available' | 'rebooting' | 'stopped' | 'modifying'
  monthlyCost: number
}

// Active Network VPC/ALB state
interface NetworkResource {
  id: string
  name: string
  type: 'vpc' | 'alb'
  cidr?: string
  subnets?: number
  routes?: number
  state: string
}

// Active Analytics Lambda state
interface AnalyticsResource {
  id: string
  name: string
  runtime: string
  timeout: string
  invocations: number
  errors: number
  state: string
}

export const ResourcesPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')

  const [resources, setResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [mode, setMode] = React.useState<'simulation' | 'live'>(() => {
    return (localStorage.getItem('cloudpulse_mode') as 'simulation' | 'live') || 'simulation'
  })
  const [awsConfigured, setAwsConfigured] = React.useState<boolean | null>(null)

  // Default states for demo / mock simulation
  const [instances, setInstances] = React.useState<ComputeInstance[]>([
    { id: 'i-0abcd1234efgh5678', name: 'cloudpulse-web-server-01', type: 't3.micro', region: 'ap-south-1a', cpu: 12.4, memory: 58.2, network: '4.2 MB/s', uptime: '14 days, 3h', state: 'running', drifted: true, driftDetails: 'Security Group SSH port 22 open to 0.0.0.0/0' },
    { id: 'i-09876fedcba543210', name: 'cloudpulse-worker-node-02', type: 't3.small', region: 'ap-south-1b', cpu: 65.1, memory: 74.0, network: '18.9 MB/s', uptime: '29 days, 12h', state: 'running' },
    { id: 'i-044111222333444aa', name: 'cloudpulse-staging-node', type: 't3.micro', region: 'ap-south-1a', cpu: 0, memory: 0, network: '0 KB/s', uptime: '0s', state: 'stopped' },
  ])

  const [buckets, setBuckets] = React.useState<StorageBucket[]>([
    { name: 'cloudpulse-static-assets-prod', region: 'ap-south-1', objectCount: 142392, storageUsed: '824.5 GB', monthlyCost: 32.99, encryption: 'AES-256 (SSE-S3)', versioning: true, lifecycle: 'Transition to Glacier after 30 days', drifted: true, driftDetails: 'Versioning configuration disabled directly via CLI' },
    { name: 'cloudpulse-db-backups-archive', region: 'ap-south-1', objectCount: 512, storageUsed: '12.4 TB', monthlyCost: 285.50, encryption: 'KMS (aws/s3)', versioning: true, lifecycle: 'Delete after 365 days' },
  ])

  const [databases, setDatabases] = React.useState<DatabaseInstance[]>([
    { id: 'db-058dfa83910c', name: 'cloudpulse-rds-postgres', engine: 'PostgreSQL 14.2', region: 'ap-south-1a', connections: 24, size: '250 GB', state: 'available', monthlyCost: 48.00 }
  ])

  const [networks, setNetworks] = React.useState<NetworkResource[]>([
    { id: 'vpc-058dfa839', name: 'cloudpulse-main-vpc', type: 'vpc', cidr: '10.0.0.0/16', subnets: 6, routes: 3, state: 'available' },
    { id: 'alb-188dfa839', name: 'cloudpulse-prod-alb', type: 'alb', state: 'active' }
  ])

  const [analytics, setAnalytics] = React.useState<AnalyticsResource[]>([
    { id: 'lambda-0123ef', name: 'cloudpulse-telemetry-aggregator', runtime: 'Python 3.9', timeout: '30s', invocations: 1240, errors: 0, state: 'active' }
  ])

  const checkAWSCredentials = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/v1/organizations/credentials', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const body = await res.json()
        setAwsConfigured(!!(body && (body.access_key_id || body.role_arn)))
      } else {
        setAwsConfigured(false)
      }
    } catch {
      setAwsConfigured(false)
    }
  }

  React.useEffect(() => {
    const handleModeChange = () => {
      const currentMode = (localStorage.getItem('cloudpulse_mode') as 'simulation' | 'live') || 'simulation'
      setMode(currentMode)
    }
    window.addEventListener('cloudpulse_mode_changed', handleModeChange)
    return () => window.removeEventListener('cloudpulse_mode_changed', handleModeChange)
  }, [])

  React.useEffect(() => {
    if (mode === 'live') {
      checkAWSCredentials()
    }
  }, [mode])

  const fetchResources = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      const url = '/api/v1/resources/'
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error('Failed to fetch resources')
      const body = await res.json()
      setResources(body)

      // Map dynamic database values to correct display groups
      if (body.length > 0) {
        // 1. Compute EC2/ECS Mappings
        const mappedInstances = body
          .filter((r: any) => r.resource_type === 'ec2' || r.resource_type === 'ecs')
          .map((r: any) => ({
            id: r.resource_id,
            name: r.name || r.resource_id,
            type: r.resource_type === 'ecs' ? 'ECS Fargate' : 't3.micro',
            region: r.region,
            cpu: r.cpu_utilization || 12.4,
            memory: r.resource_type === 'ecs' ? 45.0 : 58.2,
            network: '4.2 MB/s',
            uptime: 'Connected Live',
            state: r.state === 'provisioning' ? 'starting' : (r.state === 'running' || r.state === 'stopped' ? r.state : 'running'),
            drifted: r.resource_type === 'ec2',
            driftDetails: r.resource_type === 'ec2' ? 'Security Group SSH port 22 open to 0.0.0.0/0' : undefined
          }))
        if (mappedInstances.length > 0) {
          setInstances(mappedInstances)
        }

        // 2. Storage S3 Mappings
        const mappedBuckets = body
          .filter((r: any) => r.resource_type === 's3')
          .map((r: any) => ({
            name: r.name || r.resource_id,
            region: r.region,
            objectCount: 1420,
            storageUsed: '14.2 GB',
            monthlyCost: r.monthly_cost || 12.50,
            encryption: 'AES-256 (SSE-S3)',
            versioning: r.state !== 'provisioning',
            lifecycle: 'Transition to Glacier after 30 days',
            drifted: r.state === 'provisioning',
            driftDetails: r.state === 'provisioning' ? 'Versioning disabled during build' : undefined
          }))
        if (mappedBuckets.length > 0) {
          setBuckets(mappedBuckets)
        }

        // 3. Database RDS Mappings
        const mappedDbs = body
          .filter((r: any) => r.resource_type === 'rds')
          .map((r: any) => ({
            id: r.resource_id,
            name: r.name || r.resource_id,
            engine: 'PostgreSQL 14.2',
            region: r.region + 'a',
            connections: 18,
            size: '250 GB',
            state: r.state === 'provisioning' ? 'modifying' : (r.state === 'running' || r.state === 'available' ? 'available' : 'available'),
            monthlyCost: r.monthly_cost || 48.00
          }))
        if (mappedDbs.length > 0) {
          setDatabases(mappedDbs)
        }

        // 4. Networking VPC/ALB Mappings
        const mappedNetworks = body
          .filter((r: any) => r.resource_type === 'vpc' || r.resource_type === 'alb')
          .map((r: any) => ({
            id: r.resource_id,
            name: r.name || r.resource_id,
            type: r.resource_type as 'vpc' | 'alb',
            cidr: r.resource_type === 'vpc' ? '10.0.0.0/16' : undefined,
            subnets: r.resource_type === 'vpc' ? 6 : undefined,
            routes: r.resource_type === 'vpc' ? 3 : undefined,
            state: r.state === 'provisioning' ? 'pending' : 'available'
          }))
        if (mappedNetworks.length > 0) {
          setNetworks(mappedNetworks)
        }

        // 5. Analytics Lambda Mappings
        const mappedAnalytics = body
          .filter((r: any) => r.resource_type === 'lambda')
          .map((r: any) => ({
            id: r.resource_id,
            name: r.name || r.resource_id,
            runtime: 'Python 3.9',
            timeout: '30s',
            invocations: 1240,
            errors: 0,
            state: r.state === 'provisioning' ? 'pending' : 'active'
          }))
        if (mappedAnalytics.length > 0) {
          setAnalytics(mappedAnalytics)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchResources()
  }, [typeParam])

  // Trigger simulated EC2 state changes
  const handleInstanceAction = (id: string, action: 'start' | 'stop' | 'restart') => {
    setInstances(prev => prev.map(inst => {
      if (inst.id !== id) return inst

      if (action === 'stop') {
        setTimeout(() => {
          setInstances(curr => curr.map(c => c.id === id ? { ...c, state: 'stopped', cpu: 0, memory: 0, network: '0 KB/s' } : c))
        }, 2500)
        return { ...inst, state: 'stopping' }
      } else if (action === 'start') {
        setTimeout(() => {
          setInstances(curr => curr.map(c => c.id === id ? { ...c, state: 'running', cpu: 15.5, memory: 52.0, network: '1.2 MB/s' } : c))
        }, 2500)
        return { ...inst, state: 'starting' }
      } else {
        setTimeout(() => {
          setInstances(curr => curr.map(c => c.id === id ? { ...c, state: 'running', cpu: 12.0, memory: 58.0 } : c))
        }, 2000)
        return { ...inst, state: 'rebooting' }
      }
    }))
  }

  const handleDatabaseAction = (id: string) => {
    setDatabases(prev => prev.map(db => {
      if (db.id !== id) return db
      setTimeout(() => {
        setDatabases(curr => curr.map(c => c.id === id ? { ...c, state: 'available' } : c))
      }, 3000)
      return { ...db, state: 'rebooting' }
    }))
    setMessage('RDS Instance reboot sequence initiated.')
  }

  // Toggle S3 Versioning state
  const handleToggleVersioning = (name: string) => {
    setBuckets(prev => prev.map(b => b.name === name ? { ...b, versioning: !b.versioning } : b))
    setMessage('S3 Object Versioning policy updated successfully!')
  }

  const handleSyncResources = async () => {
    const token = localStorage.getItem('token')
    setSyncing(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/v1/resources/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Synchronization request failed')
      await res.json()
      setMessage('AWS Resource Inventory synced successfully!')
      fetchResources()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const runningCount = resources.filter(r => r.state === 'running' || r.state === 'available' || r.state === 'active').length
  const stoppedCount = resources.filter(r => r.state === 'stopped').length

  const getHeaderDetails = () => {
    switch (typeParam) {
      case 'compute':
        return { title: 'Compute Services', subtitle: 'Configure, start/stop server instances and container workloads', card: 'EC2 Instances' }
      case 'storage':
        return { title: 'Storage Services', subtitle: 'Manage bucket keys, versioning, and lifecycle policies', card: 'S3 Buckets' }
      case 'database':
        return { title: 'Database Services', subtitle: 'Provision, monitor, and scale RDS database instances', card: 'RDS Instances' }
      case 'networking':
        return { title: 'Networking Services', subtitle: 'Configure VPC subnets, route tables, and Application Load Balancers', card: 'VPCs & ALBs' }
      case 'analytics':
        return { title: 'Analytics & Serverless', subtitle: 'Deploy serverless lambda triggers and manage data analytics flow', card: 'Lambda Functions' }
      default:
        return { title: 'AWS Resources', subtitle: 'Synced database representation of discovered resources', card: 'All Resources' }
    }
  }

  const header = getHeaderDetails()
  const activeNav = typeParam ? typeParam : 'resources'

  return (
    <DashboardLayout activeNavItem={activeNav}>
      <div className="space-y-lg">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{header.title}</h1>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400">{header.subtitle}</p>
          </div>
          <Button 
            variant="primary" 
            isLoading={syncing}
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleSyncResources}
          >
            Sync AWS Inventory
          </Button>
        </div>

        {error && <Alert type="error" title="Action Error" dismissible>{error}</Alert>}

        {mode === 'live' && awsConfigured === false && (
          <Alert type="warning" title="AWS Configuration Missing">
            Live AWS Mode is active, but your AWS trust connection is not configured. 
            Please go to <Link to="/settings" className="underline font-bold text-sky-600 dark:text-sky-400">Settings</Link> to configure your connection.
          </Alert>
        )}

        {message && <Alert type="success" title="Success" dismissible>{message}</Alert>}

        {/* 1. COMPUTE MANAGEMENT SCREEN */}
        {typeParam === 'compute' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg animate-fade-in">
            {instances.map(inst => (
              <Card 
                key={inst.id} 
                className="rounded-2xl border border-slate-100 dark:border-neutral-700 hover:shadow-elevation-1 transition-all"
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <Server className="h-5 w-5 text-sky-600" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{inst.name}</span>
                    </div>
                    <div>
                      {inst.state === 'running' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase">Running</span>}
                      {inst.state === 'stopped' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-red-50 text-red-600 font-bold uppercase">Stopped</span>}
                      {inst.state === 'stopping' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-amber-50 text-amber-600 font-bold uppercase animate-pulse">Stopping</span>}
                      {inst.state === 'starting' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-sky-50 text-sky-600 font-bold uppercase animate-pulse">Starting</span>}
                      {inst.state === 'rebooting' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-amber-50 text-amber-500 font-bold uppercase animate-pulse">Rebooting</span>}
                    </div>
                  </div>
                }
              >
                <div className="space-y-md">
                  {inst.drifted && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 p-sm rounded-lg text-xs flex items-center gap-2 mb-md font-semibold">
                      <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                      <span>DRIFT DETECTED: {inst.driftDetails}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-md text-xs border-b border-slate-50 dark:border-neutral-700/60 pb-md">
                    <div>
                      <span className="text-slate-400 block mb-1">Instance ID</span>
                      <code className="text-neutral-700 dark:text-neutral-300 font-semibold">{inst.id}</code>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Instance Type / Region</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{inst.type} | {inst.region}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-sm text-center">
                    <div className="p-sm bg-slate-50 dark:bg-neutral-800/40 rounded-xl">
                      <Cpu className="h-4 w-4 mx-auto text-sky-600 mb-1" />
                      <span className="text-[10px] text-slate-400 block">CPU</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{inst.cpu}%</span>
                    </div>
                    <div className="p-sm bg-slate-50 dark:bg-neutral-800/40 rounded-xl">
                      <HardDrive className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                      <span className="text-[10px] text-slate-400 block">Memory</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{inst.memory}%</span>
                    </div>
                    <div className="p-sm bg-slate-50 dark:bg-neutral-800/40 rounded-xl">
                      <Clock className="h-4 w-4 mx-auto text-indigo-600 mb-1" />
                      <span className="text-[10px] text-slate-400 block">Uptime</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate block">{inst.uptime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-sm pt-md border-t border-slate-50 dark:border-neutral-700/60 justify-end">
                    {inst.state === 'stopped' ? (
                      <Button variant="primary" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white font-bold" icon={<Play className="h-3.5 w-3.5" />} onClick={() => handleInstanceAction(inst.id, 'start')}>
                        Start
                      </Button>
                    ) : (
                      <>
                        <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 font-bold" icon={<RotateCw className="h-3.5 w-3.5" />} onClick={() => handleInstanceAction(inst.id, 'restart')} disabled={inst.state !== 'running'}>
                          Restart
                        </Button>
                        <Button variant="secondary" size="sm" className="text-red-600 border border-red-200 hover:bg-red-50 bg-white font-bold" icon={<Square className="h-3.5 w-3.5" />} onClick={() => handleInstanceAction(inst.id, 'stop')} disabled={inst.state !== 'running'}>
                          Stop
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 text-neutral-700 font-bold">
                      View Logs
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 2. STORAGE MANAGEMENT SCREEN */}
        {typeParam === 'storage' && (
          <div className="space-y-lg animate-fade-in">
            {buckets.map(bucket => (
              <Card 
                key={bucket.name}
                className="rounded-2xl border border-slate-100 dark:border-neutral-700 hover:shadow-elevation-1 transition-all"
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <HardDrive className="h-5 w-5 text-emerald-600" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{bucket.name}</span>
                    </div>
                    <Badge variant="success">{bucket.region}</Badge>
                  </div>
                }
              >
                <div className="space-y-md">
                  {bucket.drifted && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 p-sm rounded-lg text-xs flex items-center gap-2 mb-md font-semibold">
                      <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                      <span>DRIFT DETECTED: {bucket.driftDetails}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-md border-b border-slate-50 dark:border-neutral-700/60 pb-md text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Object Count</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{bucket.objectCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Total Storage Size</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{bucket.storageUsed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Monthly Cost Target</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">${bucket.monthlyCost.toFixed(2)}/mo</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Encryption Protocol</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> {bucket.encryption}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-xs border-b border-slate-50 dark:border-neutral-700/60 pb-md">
                    <div className="flex items-center justify-between p-sm bg-slate-50 dark:bg-neutral-800/40 rounded-xl">
                      <div className="flex items-center gap-sm">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <div>
                          <span className="font-semibold block text-neutral-800 dark:text-neutral-200">Object Versioning</span>
                          <span className="text-[10px] text-slate-400">Keep history of deleted files</span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="bg-white border hover:bg-slate-50 font-bold" onClick={() => handleToggleVersioning(bucket.name)}>
                        {bucket.versioning ? 'Disable' : 'Enable'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-sm bg-slate-50 dark:bg-neutral-800/40 rounded-xl">
                      <div className="flex items-center gap-sm">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <div>
                          <span className="font-semibold block text-neutral-800 dark:text-neutral-200">Lifecycle Transitions</span>
                          <span className="text-[10px] text-slate-400">{bucket.lifecycle}</span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="bg-white border hover:bg-slate-50 font-bold">
                        Configure
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-sm justify-end">
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 font-bold" icon={<Upload className="h-4 w-4" />}>
                      Upload Files
                    </Button>
                    <Button variant="secondary" size="sm" className="text-red-600 border border-red-200 hover:bg-red-50 bg-white font-bold" icon={<Trash2 className="h-4 w-4" />}>
                      Empty Bucket
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 3. DATABASE MANAGEMENT SCREEN */}
        {typeParam === 'database' && (
          <div className="space-y-lg animate-fade-in">
            {databases.map(db => (
              <Card 
                key={db.id}
                className="rounded-2xl border border-slate-100 dark:border-neutral-700 hover:shadow-elevation-1 transition-all"
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <Database className="h-5 w-5 text-purple-600" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{db.name}</span>
                    </div>
                    <div>
                      {db.state === 'available' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase">Available</span>}
                      {db.state === 'rebooting' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-amber-50 text-amber-600 font-bold uppercase animate-pulse">Rebooting</span>}
                      {db.state === 'modifying' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-sky-50 text-sky-600 font-bold uppercase animate-pulse">Modifying</span>}
                      {db.state === 'stopped' && <span className="px-2.5 py-0.5 text-xs rounded-full bg-red-50 text-red-600 font-bold uppercase">Stopped</span>}
                    </div>
                  </div>
                }
              >
                <div className="space-y-md">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-md border-b border-slate-50 dark:border-neutral-700/60 pb-md text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Database Engine</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{db.engine}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Target Region</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{db.region}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Active Connections</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" /> {db.connections} sessions</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Allocated Storage</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{db.size}</span>
                    </div>
                  </div>

                  <div className="flex gap-sm justify-end">
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 font-bold animate-pulse" icon={<RotateCw className="h-4 w-4" />} onClick={() => handleDatabaseAction(db.id)} disabled={db.state !== 'available'}>
                      Reboot RDS
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 font-bold" icon={<FileCheck className="h-4 w-4" />}>
                      Create Snapshot
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 text-neutral-700 font-bold" icon={<Terminal className="h-4 w-4" />}>
                      RDS Query logs
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 4. NETWORKING VPC/ALB SCREEN */}
        {typeParam === 'networking' && (
          <div className="space-y-lg animate-fade-in">
            {networks.map(net => (
              <Card 
                key={net.id}
                className="rounded-2xl border border-slate-100 dark:border-neutral-700 hover:shadow-elevation-1 transition-all"
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <Network className="h-5 w-5 text-sky-600" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{net.name}</span>
                    </div>
                    <Badge variant="info">{net.type.toUpperCase()}</Badge>
                  </div>
                }
              >
                <div className="space-y-md">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-md border-b border-slate-50 dark:border-neutral-700/60 pb-md text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Resource ID</span>
                      <code className="text-neutral-700 dark:text-neutral-300 font-semibold">{net.id}</code>
                    </div>
                    {net.type === 'vpc' ? (
                      <>
                        <div>
                          <span className="text-slate-400 block mb-1">CIDR Block</span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-bold">{net.cidr}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Associated Subnets</span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-bold">{net.subnets} subnets</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Route Tables</span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-bold">{net.routes} tables</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-slate-400 block mb-1">DNS Address</span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-semibold text-[10px] truncate block">cloudpulse-alb-124930.ap-south-1.elb.amazonaws.com</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Target Health</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> 100% Healthy</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">Listener Rules</span>
                          <span className="text-neutral-800 dark:text-neutral-200 font-bold">HTTP:80 / HTTPS:443</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-sm justify-end">
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 font-bold" icon={<FileCheck className="h-4 w-4" />}>
                      {net.type === 'vpc' ? 'Manage Subnets' : 'View Target Groups'}
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 text-neutral-700 font-bold" icon={<Terminal className="h-4 w-4" />}>
                      Security Rules
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 5. ANALYTICS LAMBDA SCREEN */}
        {typeParam === 'analytics' && (
          <div className="space-y-lg animate-fade-in">
            {analytics.map(item => (
              <Card 
                key={item.id}
                className="rounded-2xl border border-slate-100 dark:border-neutral-700 hover:shadow-elevation-1 transition-all"
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{item.name}</span>
                    </div>
                    <Badge variant="success">ACTIVE</Badge>
                  </div>
                }
              >
                <div className="space-y-md">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-md border-b border-slate-50 dark:border-neutral-700/60 pb-md text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Runtime</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{item.runtime}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Function Timeout</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{item.timeout}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Executions (24h)</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-bold">{item.invocations.toLocaleString()} runs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Errors logged</span>
                      <span className={`${item.errors > 0 ? 'text-red-600' : 'text-emerald-600'} font-bold`}>{item.errors} errors</span>
                    </div>
                  </div>

                  <div className="flex gap-sm justify-end">
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 font-bold" icon={<Terminal className="h-4 w-4" />}>
                      View CloudWatch Logs
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 text-neutral-700 font-bold" icon={<Activity className="h-4 w-4" />}>
                      Invoke Function
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 6. DEFAULT/FALLBACK LIST VIEW */}
        {!typeParam && (
          <>
            <Alert type="info">
              Total database discovered resources: <strong>{resources.length}</strong> | Active: <strong>{runningCount}</strong> | Stopped: <strong>{stoppedCount}</strong>
            </Alert>
            <Card header={<h2 className="text-h3 font-semibold">{header.card}</h2>}>
              {loading ? (
                <div className="p-lg text-center text-neutral-500">Retrieving synced assets list...</div>
              ) : (
                <DataTable 
                  columns={[
                    { key: 'resource_id', label: 'Resource ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'resource_type', label: 'Type' },
                    { key: 'state', label: 'State' },
                    { key: 'cpu_utilization', label: 'Avg CPU' },
                    { key: 'monthly_cost', label: 'Cost Rate' },
                  ]} 
                  rows={resources.map(r => ({
                    id: String(r.id),
                    resource_id: r.resource_id,
                    name: r.name || '-',
                    resource_type: r.resource_type.toUpperCase(),
                    state: r.state,
                    cpu_utilization: r.cpu_utilization !== null ? `${r.cpu_utilization.toFixed(1)}%` : '-',
                    monthly_cost: `$${(r.monthly_cost || 0).toFixed(2)}/mo`
                  }))} 
                />
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
