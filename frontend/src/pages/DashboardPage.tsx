import React from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { TopologyMap } from '../components/TopologyMap'
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
  Users, 
  DollarSign, 
  Activity, 
  Cpu, 
  Database, 
  Zap, 
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Grid,
  ArrowRight
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [dashboardType, setDashboardType] = React.useState<'executive' | 'devops' | 'finance'>('executive')
  const [activeTab, setActiveTab] = React.useState<'1d' | '7d' | '30d'>('1d')
  const [provisioned, setProvisioned] = React.useState<string[]>([])

  // Load provisioned modules
  const loadProvisioned = () => {
    const saved = localStorage.getItem('provisioned_modules')
    if (saved) {
      setProvisioned(JSON.parse(saved))
    } else {
      setProvisioned([])
    }
  }

  React.useEffect(() => {
    loadProvisioned()
  }, [])

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
      const body = await res.json()
      setData(body)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDashboardData()
  }, [dashboardType])

  if (loading) {
    return (
      <DashboardLayout activeNavItem="dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-body-lg text-neutral-600 dark:text-neutral-400">Loading operational telemetry...</div>
        </div>
      </DashboardLayout>
    )
  }

  const isComputeActive = provisioned.includes('compute')
  const isStorageActive = provisioned.includes('storage')
  const isDatabaseActive = provisioned.includes('database')
  const isAnalyticsActive = provisioned.includes('analytics')
  const isBillingActive = provisioned.includes('billing')

  // If no services have been provisioned yet
  if (provisioned.length === 0) {
    return (
      <DashboardLayout activeNavItem="dashboard">
        <div className="flex flex-col items-center justify-center min-h-[480px] p-lg max-w-xl mx-auto text-center space-y-md">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/20 text-sky-600 rounded-full animate-bounce">
            <Grid className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Provision Cloud Modules</h1>
          <p className="text-body-md text-neutral-500">
            Welcome to CloudPulse AI. To get started, please visit the Module Catalog and provision core infrastructure services (Compute, Storage, Database, etc.) to activate telemetry.
          </p>
          <Link to="/">
            <Button variant="primary" icon={<ArrowRight className="h-4 w-4" />}>
              Open Module Catalog
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const COLORS = ['#0284c7', '#0d9488', '#f59e0b', '#8b5cf6', '#ef4444']

  return (
    <DashboardLayout activeNavItem="dashboard">
      <div className="space-y-lg">
        {/* Header and Dashboard Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md border-b border-slate-200 dark:border-neutral-700 pb-md">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white capitalize">{dashboardType} Dashboard</h1>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400 font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> CloudPulse AI Engine Active
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
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">High CPU Load Alert</h4>
                  <p className="text-[11px] text-slate-500 mt-1">`cloudpulse-worker-node-02` hit 85% utilization peak. Scale recommendations triggered.</p>
                </div>
              </div>
              <div className="p-md bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700/60 flex items-start gap-3 shadow-sm">
                <TrendingDown className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Rightsizing Opportunities</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Found 2 idle EC2 compute instances. Changing type to t3.nano saves $15.00/mo.</p>
                </div>
              </div>
              <div className="p-md bg-white dark:bg-neutral-800 rounded-xl border border-slate-100 dark:border-neutral-700/60 flex items-start gap-3 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-indigo-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Storage Cleanup Tip</h4>
                  <p className="text-[11px] text-slate-500 mt-1">S3 archive bucket lifecycle can be shifted to Glacier Deep Archive to save 40%.</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* EXECUTIVE DASHBOARD VIEW */}
        {dashboardType === 'executive' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              <StatCard
                label="SaaS App Instances"
                value={isComputeActive ? `${data?.resources_by_type ? Object.values(data.resources_by_type).reduce((a: any, b: any) => a + b, 0) : 15} Active` : 'Locked'}
                trendLabel={isComputeActive ? "Status: Healthy" : "Provision Compute module"}
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Active Systems"
                value={isComputeActive ? "14.2K Users" : 'Locked'}
                trend={isComputeActive ? 8.5 : undefined}
                trendLabel={isComputeActive ? "today" : "Access metrics"}
                icon={<Users className="h-5 w-5 text-sky-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Monthly Spend"
                value={isBillingActive ? `$${(data?.monthly_cost || 67.80).toFixed(2)}` : 'Locked'}
                trend={isBillingActive ? -8 : undefined}
                trendLabel={isBillingActive ? "vs last month" : "Provision Billing module"}
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="System Health"
                value="99.98% Uptime"
                trendLabel="All Systems Operational"
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
                {isStorageActive ? (
                  <>
                    <div className="h-[200px] w-full relative mt-md">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(data?.resources_by_type || {}).map(([key, val]) => ({ name: key.toUpperCase(), value: Number(val) }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {Object.entries(data?.resources_by_type || {}).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-md gap-y-sm mt-md">
                      {Object.entries(data?.resources_by_type || {}).map(([key, val]: any, index) => (
                        <div key={key} className="flex items-center gap-sm text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-500 font-medium">{key.toUpperCase()} ({val})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-lg text-center text-slate-400 text-body-sm">
                    S3 Storage module is unprovisioned. Provision S3 to see resource allocations.
                  </div>
                )}
              </Card>
            </div>
          </>
        )}

        {/* DEVOPS DASHBOARD VIEW */}
        {dashboardType === 'devops' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              <StatCard
                label="Running Instances"
                value={isComputeActive ? `${data?.resources_by_state?.active || data?.resources_by_state?.running || 0} nodes` : 'Locked'}
                trendLabel="EC2 Active Instances"
                icon={<Cpu className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Stopped Instances"
                value={isComputeActive ? `${data?.resources_by_state?.stopped || 0} nodes` : 'Locked'}
                trendLabel="EC2 Offline Instances"
                icon={<Zap className="h-5 w-5 text-amber-500" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="High CPU Alarms"
                value={isComputeActive ? `${data?.high_utilization_count || 0} nodes` : 'Locked'}
                trendLabel="Utilization thresholds"
                icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Active Databases"
                value={isDatabaseActive ? "2 DBs" : 'Locked'}
                trendLabel="RDS Instances Status"
                icon={<Database className="h-5 w-5 text-purple-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
            </div>

            {/* Performance charts and Topology Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
              {/* Analytics correlation graph */}
              <Card className="lg:col-span-2 rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Performance Correlation (Latency vs DB Queries)</h2>}>
                {isAnalyticsActive ? (
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
                ) : (
                  <div className="p-lg text-center text-slate-400 text-body-sm min-h-[280px] flex items-center justify-center">
                    Provision Analytics module to unlock active Latency and Query correlation telemetry.
                  </div>
                )}
              </Card>

              {/* Topology Map */}
              <Card className="rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">CloudPulse Topology Map</h2>}>
                <TopologyMap />
              </Card>
            </div>

            {/* Database Monitoring telemetry */}
            {isDatabaseActive && (
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
            )}
          </>
        )}

        {/* FINANCE DASHBOARD VIEW */}
        {dashboardType === 'finance' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
              <StatCard
                label="Monthly Spend Rate"
                value={isBillingActive ? `$${(data?.total_monthly_cost || 67.80).toFixed(2)}` : 'Locked'}
                trend={isBillingActive ? -8 : undefined}
                trendLabel={isBillingActive ? "vs last month" : "Provision Billing module"}
                icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Savings Recommendation"
                value={isBillingActive ? `$${(data?.potential_savings || 15.00).toFixed(2)}` : 'Locked'}
                trendLabel={isBillingActive ? "Estimated monthly savings" : "Assess cost items"}
                icon={<TrendingDown className="h-5 w-5 text-sky-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Optimized Monthly Run"
                value={isBillingActive ? `$${((data?.total_monthly_cost || 67.80) - (data?.potential_savings || 15.00)).toFixed(2)}` : 'Locked'}
                trendLabel="Post-recommendation forecast"
                icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
              <StatCard
                label="Cloud Optimization Score"
                value={isBillingActive ? "82%" : 'Locked'}
                trendLabel={isBillingActive ? "Grade: High efficiency" : "Configure targets"}
                icon={<Activity className="h-5 w-5 text-emerald-600" />}
                backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
              <Card className="lg:col-span-2 rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Service Billing Allocation ($)</h2>}>
                {isBillingActive ? (
                  <div className="h-[280px] w-full mt-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(data?.cost_by_service || {}).map(([key, val]) => ({ name: key.toUpperCase(), cost: val }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="cost" fill="#0284c7" radius={[6, 6, 0, 0]} name="Monthly Cost ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="p-lg text-center text-slate-400 text-body-sm min-h-[280px] flex items-center justify-center">
                    Provision Billing module to unlock service cost allocation analysis.
                  </div>
                )}
              </Card>

              <Card className="rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Financial Allocation</h2>}>
                {isBillingActive ? (
                  <>
                    <div className="h-[200px] w-full relative mt-md">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(data?.cost_by_service || {}).map(([key, val]) => ({ name: key.toUpperCase(), value: Number(val) }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                          >
                            {Object.entries(data?.cost_by_service || {}).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-md gap-y-sm mt-md">
                      {Object.entries(data?.cost_by_service || {}).map(([key, val]: any, index) => (
                        <div key={key} className="flex items-center gap-sm text-xs">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-500 font-medium">{key.toUpperCase()} (${val.toFixed(2)})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-lg text-center text-slate-400 text-body-sm">
                    Provision Billing module to display service budget allocation charts.
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
