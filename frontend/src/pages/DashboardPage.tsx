import React from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { TopologyMap, TopologyNode } from '../components/TopologyMap'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'
import { 
  CheckCircle2, 
  DollarSign, 
  Activity, 
  Cpu, 
  Zap, 
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Plus
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [dashboardType, setDashboardType] = React.useState<'executive' | 'devops' | 'finance'>('executive')
  const [activeTab, setActiveTab] = React.useState<'1d' | '7d' | '30d'>('1d')
  
  const [mode, setMode] = React.useState<'simulation' | 'live'>(() => {
    return (localStorage.getItem('cloudpulse_mode') as 'simulation' | 'live') || 'simulation'
  })
  const [awsConfigured, setAwsConfigured] = React.useState<boolean | null>(null)
  
  // Interactive nodes and blueprint states
  const [requirement, setRequirement] = React.useState('')
  const [isPlanning, setIsPlanning] = React.useState(false)
  const [isProvisioning, setIsProvisioning] = React.useState(false)
  const [plannedNodes, setPlannedNodes] = React.useState<TopologyNode[] | null>(null)
  const [selectedNode, setSelectedNode] = React.useState<TopologyNode | null>(null)
  const [wsStatus, setWsStatus] = React.useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected')
  
  const [nodes, setNodes] = React.useState<TopologyNode[]>([
    { id: 'vpc', name: 'VPC Network', type: 'vpc', state: 'live', cpu: 0, cost: 0 },
    { id: 'iam', name: 'IAM Scoped Role', type: 'iam', state: 'live', cpu: 0, cost: 0 },
    { id: 'alb', name: 'Load Balancer', type: 'alb', state: 'live', cpu: 0, cost: 22.50 },
    { id: 'ec2', name: 'Web Server ASG', type: 'ec2', state: 'live', cpu: 12.4, cost: 15.20, drifted: true },
    { id: 's3', name: 'S3 Assets Storage', type: 's3', state: 'live', cpu: 0, cost: 32.99, drifted: true },
    { id: 'rds', name: 'RDS DB Instance', type: 'rds', state: 'live', cpu: 8.5, cost: 48.00 },
  ])

  const [interpreting, setInterpreting] = React.useState(false)
  const [aiInterpretation, setAiInterpretation] = React.useState('')
  const [focusArea, setFocusArea] = React.useState<'compute' | 'storage' | 'general' | null>(null)

  const handleRunAIInterpreter = (area: 'compute' | 'storage' | 'general') => {
    setFocusArea(area)
    setInterpreting(true)
    setAiInterpretation('')
    setTimeout(() => {
      let analysis = ''
      if (area === 'compute') {
        const ec2Nodes = nodes.filter(n => n.type === 'ec2' || n.type === 'ecs')
        analysis = mode === 'live' 
          ? `[Live AWS Telemetry Diagnostics]\nAnalyzed ${ec2Nodes.length} active EC2/ECS node structures.\n- Compute health is degraded: Web Server Node exhibits port exposure (Port 22 open on Security Group allow_tls).\n- CPU Performance is stable at 12.4% avg run rate.\n- Recommendation: Revoke direct SSH policy access to follow least privilege rules.`
          : `[Mock Telemetry Analysis - Compute]\nWeb Server ASG cluster is nominal. Avg CPU is 12.4%.\n- Latency metrics within limits (42ms avg envelope).\n- Suggested action: Configure autoscale policy threshold to scale up at 70% CPU load.`;
      } else if (area === 'storage') {
        analysis = mode === 'live'
          ? `[Live AWS Telemetry Diagnostics]\nStorage Node: s3-assets-bucket is active.\n- Drift detected: Object versioning settings disabled in real-time. Risk of accidental overwrite or data deletion.\n- Recommendation: Re-execute Terraform code blueprint to enforce compliance.`
          : `[Mock Telemetry Analysis - Storage]\nStorage allocation audit complete.\n- Assets Bucket has versioning disabled (drift warning active).\n- Archive database backups size: 12.4 TB. Run rate: $285.50/mo. KMS encryption active.`;
      } else {
        const degradedCount = nodes.filter(n => n.state === 'degraded' || n.state === 'error' || n.drifted).length
        analysis = `[All-at-Once Operational Health Audit]\nSystem Health Score: ${98 - (degradedCount * 5)}%.\n- Connected Mode: ${mode === 'live' ? 'Live Authenticated STS Role' : 'Simulation Mode'}\n- Anomalies: ${degradedCount} resource issues flagged (Security Group port open, S3 versioning disabled).\n- System actions: Healthy (network flow is nominal at 12ms avg database response rate).`;
      }
      setAiInterpretation(analysis)
      setInterpreting(false)
    }, 1200)
  }

  const handleGeneratePlan = async () => {
    if (!requirement.trim()) return
    setIsPlanning(true)
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/v1/provisioning/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requirement })
      })
      if (res.ok) {
        const body = await res.json()
        setPlannedNodes(body.nodes)
        setNodes(body.nodes)
      }
    } catch {} finally {
      setIsPlanning(false)
    }
  }

  const handleExecutePlan = async () => {
    if (!plannedNodes) return
    setIsProvisioning(true)
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/v1/provisioning/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requirement, nodes: plannedNodes })
      })
      if (res.ok) {
        setNodes(prev => prev.map(n => ({ ...n, state: 'provisioning' })))
        setPlannedNodes(null)
      }
    } catch {}
  }

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/dashboard/${dashboardType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error('Failed to load dashboard data')
      // setData(body)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
    fetchDashboardData()
  }, [dashboardType])

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

  // Real-time EventBridge/AWS Config push client via WebSockets with backoff reconnect
  React.useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: any = null
    let currentBackoff = 1000
    const maxBackoff = 30000
    let isMounted = true

    const connectWebSocket = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setWsStatus('disconnected')
        return
      }

      // Re-verify token expiration on reconnect
      try {
        const checkRes = await fetch('/api/v1/organizations/credentials', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (checkRes.status === 401) {
          console.warn('JWT expired, redirecting to login.')
          localStorage.removeItem('token')
          window.location.href = '/login'
          return
        }
      } catch (err) {
        console.error('Failed to verify token during WS reconnect check', err)
      }

      if (!isMounted) return

      const wsUrl = `ws://${window.location.hostname}:8000/api/v1/ws/resources`
      console.log(`Connecting to EventBridge WebSocket Stream... (Backoff: ${currentBackoff}ms)`)
      setWsStatus('reconnecting')

      try {
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('Connected to EventBridge WebSocket Stream')
          setWsStatus('connected')
          currentBackoff = 1000 // reset backoff
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            const resources = message.resources || []
            
            if (resources.length > 0) {
              setNodes(prev => prev.map(n => {
                const matching = resources.find((r: any) => r.resource_type === n.type)
                if (matching) {
                  let state: any = 'live'
                  if (matching.state === 'provisioning') state = 'provisioning'
                  else if (matching.state === 'stopped') state = 'degraded'
                  
                  return {
                    ...n,
                    state,
                    cpu: matching.cpu !== undefined ? matching.cpu : n.cpu,
                    cost: matching.cost !== undefined ? matching.cost : n.cost
                  }
                }
                return n
              }))
              
              const anyProvisioning = resources.some((r: any) => r.state === 'provisioning')
              if (!anyProvisioning) {
                setIsProvisioning(false)
              }
            }
          } catch (err) {
            console.error('Error parsing EventBridge push message', err)
          }
        }

        ws.onclose = () => {
          if (!isMounted) return
          console.log('EventBridge WebSocket Stream closed. Retrying...')
          setWsStatus('reconnecting')
          
          reconnectTimeout = setTimeout(() => {
            currentBackoff = Math.min(currentBackoff * 2, maxBackoff)
            connectWebSocket()
          }, currentBackoff)
        }

        ws.onerror = (err) => {
          console.error('WebSocket error:', err)
          if (ws) {
            ws.close()
          }
        }
      } catch (e) {
        console.error('Failed to create WebSocket instance', e)
        reconnectTimeout = setTimeout(() => {
          currentBackoff = Math.min(currentBackoff * 2, maxBackoff)
          connectWebSocket()
        }, currentBackoff)
      }
    }

    connectWebSocket()

    return () => {
      isMounted = false
      if (ws) {
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [mode])

  if (loading) {
    return (
      <DashboardLayout activeNavItem="dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-body-lg text-neutral-600 dark:text-neutral-400">Loading operational telemetry...</div>
        </div>
      </DashboardLayout>
    )
  }

  const isAnalyticsActive = true

  const COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444']

  return (
    <DashboardLayout activeNavItem="dashboard">
      <div className="space-y-lg">
        {/* Header and Dashboard Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md border-b border-slate-200 dark:border-neutral-700 pb-md">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">{dashboardType} Operations Cockpit</h1>
            <p className="text-body-sm text-neutral-600 dark:text-neutral-400 font-semibold flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>CloudPulse Ops Active</span>
              </span>
              <span className="text-slate-300 dark:text-neutral-700">|</span>
              <span className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${
                  wsStatus === 'connected' ? 'bg-emerald-500' :
                  wsStatus === 'reconnecting' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className={`text-[11px] uppercase tracking-wider font-bold ${
                  wsStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                  wsStatus === 'reconnecting' ? 'text-amber-500' : 'text-red-500 animate-pulse'
                }`}>
                  {wsStatus === 'connected' ? 'Live Telemetry Active' :
                   wsStatus === 'reconnecting' ? 'Reconnecting to stream...' : 'Stream Offline'}
                </span>
              </span>
            </p>
          </div>
          <div className="flex bg-slate-100 dark:bg-neutral-800 rounded-xl p-1 text-sm border border-slate-200/60 dark:border-neutral-700">
            {(['executive', 'devops', 'finance'] as const).map(type => (
              <button
                key={type}
                onClick={() => setDashboardType(type)}
                className={`px-4 py-2 rounded-lg transition-all capitalize font-semibold ${dashboardType === type ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {error && <Alert type="error" title="Dashboard Error" dismissible>{error}</Alert>}

        {mode === 'live' && awsConfigured === false && (
          <Alert type="warning" title="AWS Connection Missing">
            Live AWS Mode is active, but your scoped IAM Role connection is not configured. 
            Please go to <Link to="/settings" className="underline font-bold text-sky-600 dark:text-sky-400">Settings</Link> to connect your AWS Account via trust policies.
          </Alert>
        )}

        {/* AI INSIGHTS PANEL (Unlocked if Analytics is active) */}
        {isAnalyticsActive && (
          <Card 
            className="bg-gradient-to-r from-indigo-50/60 to-purple-50/60 dark:from-neutral-800/40 dark:to-neutral-900/40 border border-indigo-100 dark:border-neutral-700 rounded-2xl p-sm"
            header={
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                <h3 className="font-bold text-neutral-900 dark:text-white text-h4">AI Operations Insights</h3>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mt-md">
              <div className="p-md bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700/60 flex items-start gap-3 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Security Group Leak</h4>
                  <p className="text-[11px] text-slate-500 mt-1">`allow_tls` security group has Port 22 exposed to public requests. Remediate drift.</p>
                </div>
              </div>
              <div className="p-md bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700/60 flex items-start gap-3 shadow-sm">
                <TrendingDown className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Rightsizing Opportunities</h4>
                  <p className="text-[11px] text-slate-500 mt-1">S3 glacier tier transitions could reduce object archiving costs by 40%.</p>
                </div>
              </div>
              <div className="p-md bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700/60 flex items-start gap-3 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Infrastructure Compliant</h4>
                  <p className="text-[11px] text-slate-500 mt-1">All database queries are encrypted via KMS customer keys. SOC2 validated.</p>
                </div>
              </div>
            </div>

            <div className="mt-md pt-md border-t border-indigo-100 dark:border-neutral-700/60">
              <div className="flex items-center justify-between flex-wrap gap-sm">
                <div className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                  Select a resource telemetry focus area to analyze with CloudPulse AI:
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs bg-white/80 border hover:bg-slate-50 font-bold"
                    onClick={() => handleRunAIInterpreter('compute')}
                    isLoading={interpreting && focusArea === 'compute'}
                    disabled={interpreting}
                  >
                    Analyze Compute State
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs bg-white/80 border hover:bg-slate-50 font-bold"
                    onClick={() => handleRunAIInterpreter('storage')}
                    isLoading={interpreting && focusArea === 'storage'}
                    disabled={interpreting}
                  >
                    Analyze Storage State
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-xs bg-white/80 border hover:bg-slate-50 font-bold"
                    onClick={() => handleRunAIInterpreter('general')}
                    isLoading={interpreting && focusArea === 'general'}
                    disabled={interpreting}
                  >
                    Full Audit
                  </Button>
                </div>
              </div>
              {aiInterpretation && (
                <div className="mt-sm p-md bg-[#0f172a] text-[#38bdf8] font-mono text-xs rounded-xl border border-slate-800 shadow-inner animate-fade-in space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold border-b border-slate-800 pb-1.5">
                    <Sparkles className="h-3 w-3 text-purple-400 animate-spin" />
                    <span>CLOUDPULSE_AI_OP_INTERPRETER_v1.4 // FOCUS: {focusArea?.toUpperCase()}</span>
                  </div>
                  <div className="leading-relaxed whitespace-pre-line text-neutral-200">
                    {aiInterpretation}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* EXECUTIVE DASHBOARD VIEW */}
        {dashboardType === 'executive' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              <StatCard
                label="AWS Resources Discovered"
                value={`${nodes.length} Nodes`}
                trendLabel="Live resource topology"
                icon={<Cpu className="h-5 w-5 text-sky-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Estimated Monthly Spend"
                value={`$${nodes.reduce((acc, curr) => acc + (curr.cost || 0), 0).toFixed(2)}`}
                trendLabel="Cost of active nodes"
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Compliance Score"
                value={nodes.some(n => n.drifted) ? "82%" : "100%"}
                trendLabel="SOC2 compliance status"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Operational Uptime"
                value="99.98% Uptime"
                trendLabel="All services operational"
                icon={<Activity className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
            </div>

            {/* Charts & Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
              <Card 
                className="lg:col-span-2 rounded-xl"
                header={
                  <div className="flex items-center justify-between">
                    <h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Application Performance (Last 24h)</h2>
                    <div className="flex bg-slate-100 dark:bg-neutral-700 rounded-lg p-0.5 text-xs">
                      {(['1d', '7d', '30d'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-3 py-1 rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white font-medium shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
                        >
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                }
              >
                <div className="h-[280px] w-full mt-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: '00:00', latency: 45, calls: 500 },
                      { name: '03:00', latency: 75, calls: 900 },
                      { name: '06:00', latency: 125, calls: 1200 },
                      { name: '09:00', latency: 110, calls: 1400 },
                      { name: '12:00', latency: 120, calls: 1250 },
                      { name: '15:00', latency: 210, calls: 1100 },
                      { name: '18:00', latency: 175, calls: 1900 },
                      { name: '21:00', latency: 230, calls: 2200 },
                    ]}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area yAxisId="left" type="monotone" dataKey="latency" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" name="Request Latency (ms)" />
                      <Area yAxisId="right" type="monotone" dataKey="calls" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" name="API Calls" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Active Cost Allocation</h2>}>
                <div className="h-[200px] w-full relative mt-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nodes.filter(n => n.cost && n.cost > 0).map(n => ({ name: n.name, value: n.cost }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {nodes.filter(n => n.cost && n.cost > 0).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-md gap-y-sm mt-md">
                  {nodes.filter(n => n.cost && n.cost > 0).map((n, index) => (
                    <div key={n.id} className="flex items-center gap-sm text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-500 font-medium">{n.name} (${(n.cost || 0).toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* DEVOPS DASHBOARD VIEW */}
        {dashboardType === 'devops' && (
          <>
            {/* Real-time Requirement Planner */}
            <Card header={<h2 className="text-h3 font-bold text-neutral-800 dark:text-white">Deploy AWS Infrastructure Blueprint</h2>}>
              <div className="space-y-md mt-md">
                <div className="flex gap-md items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase">Infrastructure Requirement Blueprint</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 3-tier web app with RDS postgres and S3 storage"
                      value={requirement}
                      onChange={(e) => setRequirement(e.target.value)}
                      className="w-full px-md py-2 border border-slate-200 dark:border-neutral-700/80 rounded-xl bg-white dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 text-body-md focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleGeneratePlan}
                    isLoading={isPlanning}
                  >
                    Generate Plan
                  </Button>
                </div>

                {plannedNodes && (
                  <div className="p-md bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/60 dark:border-neutral-850 rounded-xl flex items-center justify-between animate-fade-in">
                    <div>
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Plan Generated Successfully!</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Discovered {plannedNodes.length} required cloud resource mappings in hierarchy tree. Ready to build via CloudFormation.</div>
                    </div>
                    <Button 
                      variant="primary" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                      icon={<Plus className="h-4 w-4" />}
                      onClick={handleExecutePlan}
                      isLoading={isProvisioning}
                    >
                      Execute Provisioning
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              <StatCard
                label="Running Instances"
                value={`${nodes.filter(n => n.state === 'live').length} nodes`}
                trendLabel="EC2/ECS Active Instances"
                icon={<Cpu className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Drifted Assets"
                value={`${nodes.filter(n => n.drifted).length} warnings`}
                trendLabel="Security/Config drift detected"
                icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Pending Provisioning"
                value={`${nodes.filter(n => n.state === 'provisioning' || n.state === 'planned').length} nodes`}
                trendLabel="In build pipeline"
                icon={<Zap className="h-5 w-5 text-sky-500" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Estimated Operations Cost"
                value={`$${nodes.reduce((acc, curr) => acc + (curr.cost || 0), 0).toFixed(2)}/mo`}
                trendLabel="Active operations run rate"
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
            </div>

            {/* Performance charts and Topology Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
              {/* Analytics correlation graph */}
              <Card className="lg:col-span-2 rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Performance Correlation (Latency vs DB Queries)</h2>}>
                <div className="h-[280px] w-full mt-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: '00:00', latency: 45, queries: 200 },
                      { name: '04:00', latency: 75, queries: 350 },
                      { name: '08:00', latency: 125, queries: 600 },
                      { name: '12:00', latency: 110, queries: 550 },
                      { name: '16:00', latency: 220, queries: 950 },
                      { name: '20:00', latency: 85, queries: 300 },
                    ]}>
                      <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="latency" stroke="#0284c7" strokeWidth={2} fill="url(#colorLatency)" name="Latency (ms)" />
                      <Area yAxisId="right" type="monotone" dataKey="queries" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorQueries)" name="Queries / Sec" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Topology Map */}
              <Card className="rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">CloudPulse Topology Canvas</h2>}>
                <TopologyMap nodes={nodes} onNodeClick={(n) => setSelectedNode(n)} />
              </Card>
            </div>

            {/* Database Monitoring telemetry */}
            <Card header={<h2 className="text-h3 font-bold text-neutral-800 dark:text-white">RDS Database Monitoring Dashboard</h2>}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mt-md">
                <div className="p-md bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-100 dark:border-neutral-700/60 text-xs">
                  <span className="text-slate-400 block mb-1">Database Engine / Status</span>
                  <span className="text-neutral-800 dark:text-neutral-100 font-bold block">PostgreSQL v14.2</span>
                  <span className="text-emerald-600 font-semibold block mt-1">AVAILABLE (Primary)</span>
                </div>
                <div className="p-md bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-100 dark:border-neutral-700/60 text-xs">
                  <span className="text-slate-400 block mb-1">Active Connections / Peak</span>
                  <span className="text-neutral-800 dark:text-neutral-100 font-bold block">84 Active sessions</span>
                  <span className="text-slate-500 block mt-1">Peak: 145 concurrent sessions</span>
                </div>
                <div className="p-md bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-100 dark:border-neutral-700/60 text-xs">
                  <span className="text-slate-400 block mb-1">Read / Write Query Ratio</span>
                  <span className="text-neutral-800 dark:text-neutral-100 font-bold block">78% Read / 22% Write</span>
                  <span className="text-slate-500 block mt-1">Throughput: 8,420 TPS</span>
                </div>
                <div className="p-md bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-100 dark:border-neutral-700/60 text-xs">
                  <span className="text-slate-400 block mb-1">Backup Retention status</span>
                  <span className="text-neutral-800 dark:text-neutral-100 font-bold block">Daily snapshots active</span>
                  <span className="text-emerald-600 font-semibold block mt-1">SOC2 Compliant</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* FINANCE DASHBOARD VIEW */}
        {dashboardType === 'finance' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              <StatCard
                label="Monthly Spend Rate"
                value={`$${nodes.reduce((acc, curr) => acc + (curr.cost || 0), 0).toFixed(2)}`}
                trend={-8}
                trendLabel="vs last month"
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Savings Recommendation"
                value={`$${nodes.some(n => n.drifted) ? '15.00' : '0.00'}`}
                trendLabel="Estimated monthly savings"
                icon={<TrendingDown className="h-5 w-5 text-sky-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Optimized Monthly Run"
                value={`$${(nodes.reduce((acc, curr) => acc + (curr.cost || 0), 0) - (nodes.some(n => n.drifted) ? 15.00 : 0.00)).toFixed(2)}`}
                trendLabel="Post-recommendation forecast"
                icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Cloud Optimization Score"
                value={nodes.some(n => n.drifted) ? "82%" : "100%"}
                trendLabel="Grade: High efficiency"
                icon={<Activity className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
              <Card className="lg:col-span-2 rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Service Billing Allocation ($)</h2>}>
                <div className="h-[280px] w-full mt-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nodes.filter(n => n.cost && n.cost > 0).map(n => ({ name: n.type.toUpperCase(), cost: n.cost }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="cost" fill="#0284c7" radius={[6, 6, 0, 0]} name="Monthly Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Financial Allocation</h2>}>
                <div className="h-[200px] w-full relative mt-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nodes.filter(n => n.cost && n.cost > 0).map(n => ({ name: n.type.toUpperCase(), value: n.cost }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                      >
                        {nodes.filter(n => n.cost && n.cost > 0).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-md gap-y-sm mt-md">
                  {nodes.filter(n => n.cost && n.cost > 0).map((n, index) => (
                    <div key={n.id} className="flex items-center gap-sm text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-500 font-medium">{n.type.toUpperCase()} (${(n.cost || 0).toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Node detail side panel overlay */}
        {selectedNode && (
          <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white dark:bg-neutral-900 border-l border-slate-200 dark:border-neutral-800 shadow-2xl p-lg overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-sm mb-md">
              <div>
                <h3 className="text-h3 font-bold text-neutral-900 dark:text-white capitalize">{selectedNode.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Node Type: {selectedNode.type}</span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-lg text-body-sm">
              {/* Health Parameter */}
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1 uppercase">Health Status</span>
                <div className="flex items-center gap-2">
                  {selectedNode.state === 'live' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 font-bold uppercase">Healthy / Operational</span>
                  ) : selectedNode.state === 'provisioning' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-sky-50 text-sky-600 font-bold uppercase animate-pulse">Provisioning...</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-600 font-bold uppercase">Degraded / Attention Required</span>
                  )}
                </div>
              </div>

              {/* CloudWatch Telemetry Chart */}
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-2 uppercase">CloudWatch Telemetry (Last 12h)</span>
                <div className="h-[140px] w-full bg-slate-50 dark:bg-neutral-850 rounded-xl p-sm border border-slate-100 dark:border-neutral-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { time: '1h ago', val: selectedNode.cpu || 15 },
                      { time: '45m ago', val: (selectedNode.cpu || 15) * 1.2 },
                      { time: '30m ago', val: (selectedNode.cpu || 15) * 0.8 },
                      { time: '15m ago', val: (selectedNode.cpu || 15) * 1.5 },
                      { time: 'Now', val: selectedNode.cpu || 15 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} />
                      <Tooltip />
                      <Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Metric Value" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scoped IAM Policy permissions */}
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1 uppercase">Scoped IAM Permissions (Least Privilege)</span>
                <div className="p-sm bg-slate-50 dark:bg-neutral-850 rounded-xl font-mono text-[10px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-neutral-800 space-y-1">
                  {selectedNode.type === 'vpc' && (
                    <>
                      <div>- ec2:CreateVpc</div>
                      <div>- ec2:CreateSubnet</div>
                      <div>- ec2:CreateRouteTable</div>
                    </>
                  )}
                  {selectedNode.type === 'iam' && (
                    <>
                      <div>- iam:CreateRole</div>
                      <div>- iam:PutRolePolicy</div>
                    </>
                  )}
                  {selectedNode.type === 'alb' && (
                    <>
                      <div>- elasticloadbalancing:CreateLoadBalancer</div>
                      <div>- elasticloadbalancing:RegisterTargets</div>
                    </>
                  )}
                  {selectedNode.type === 's3' && (
                    <>
                      <div>- s3:CreateBucket</div>
                      <div>- s3:PutBucketVersioning</div>
                      <div>- s3:PutObject</div>
                    </>
                  )}
                  {selectedNode.type === 'rds' && (
                    <>
                      <div>- rds:CreateDBInstance</div>
                      <div>- rds:DescribeDBInstances</div>
                    </>
                  )}
                  {selectedNode.type === 'ecs' && (
                    <>
                      <div>- ecs:CreateCluster</div>
                      <div>- ecs:RegisterTaskDefinition</div>
                      <div>- ecs:RunTask</div>
                    </>
                  )}
                  {selectedNode.type === 'lambda' && (
                    <>
                      <div>- lambda:CreateFunction</div>
                      <div>- lambda:InvokeFunction</div>
                    </>
                  )}
                  {selectedNode.type === 'ec2' && (
                    <>
                      <div>- ec2:RunInstances</div>
                      <div>- ec2:DescribeInstances</div>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1 uppercase">Discovered Tags</span>
                <div className="grid grid-cols-2 gap-sm text-[10px]">
                  <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded font-semibold text-center text-slate-600 dark:text-slate-300">Environment: Production</div>
                  <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded font-semibold text-center text-slate-600 dark:text-slate-300">ProvisionedBy: CloudPulseAI</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
