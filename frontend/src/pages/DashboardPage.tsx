import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
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
  Cell 
} from 'recharts'
import { 
  CheckCircle2, 
  Users, 
  DollarSign, 
  Activity, 
  Cpu, 
  Database, 
  Zap, 
  HardDrive 
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'1d' | '7d' | '30d'>('1d')

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    try {
      const res = await fetch('/api/v1/dashboard/executive', {
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
  }, [])

  if (loading) {
    return (
      <DashboardLayout activeNavItem="dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-body-lg text-neutral-600 dark:text-neutral-400">Loading CloudPulse Dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  // Double area chart performance data
  const performanceData = [
    { name: '00:00', latency: 45, calls: 500 },
    { name: '03:00', latency: 75, calls: 900 },
    { name: '06:00', latency: 125, calls: 1200 },
    { name: '09:00', latency: 110, calls: 1400 },
    { name: '07 Jun', latency: 145, calls: 1000 },
    { name: '12:00', latency: 120, calls: 1250 },
    { name: '08:00', latency: 210, calls: 1100 },
    { name: '02:00', latency: 115, calls: 1650 },
    { name: '14:00', latency: 175, calls: 1900 },
    { name: '18:00', latency: 230, calls: 2200 },
  ]

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6']

  const costData = Object.entries(data?.resources_by_type || {}).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: Number(val)
  }))

  const finalCostData = costData.length > 0 ? costData : [
    { name: 'EC2', value: 3 },
    { name: 'RDS', value: 1 },
    { name: 'S3', value: 11 },
  ]

  const runningCount = data?.resources_by_type ? Object.values(data.resources_by_type).reduce((a: any, b: any) => a + b, 0) : 15
  const stoppedCount = data?.recommendations?.length || 0

  return (
    <DashboardLayout activeNavItem="dashboard">
      <div className="space-y-lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Platform Dashboard</h1>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400">Welcome back, Ava!</p>
          </div>
          <div className="flex items-center gap-sm">
            <Button variant="primary" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold">
              Create New App
            </Button>
            <Button variant="secondary" className="bg-white hover:bg-slate-50 border border-slate-200 text-neutral-700">
              View Alerts
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" title="Dashboard Error" dismissible>
            {error}
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard
            label="SaaS App Instances"
            value={`${runningCount} Active / ${stoppedCount} Paused`}
            trendLabel="Status: Healthy"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="User Activity"
            value="14.2K Active Users"
            trend={8.5}
            trendLabel="today"
            icon={<Users className="h-5 w-5 text-sky-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Monthly Revenue"
            value={`$${(data?.monthly_cost || 67.80).toFixed(2)}`}
            trend={-8}
            trendLabel="vs last month"
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Main Area Chart */}
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
                <AreaChart data={performanceData}>
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
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 8 }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="latency" 
                    stroke="#0284c7" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorLatency)" 
                    name="Request Latency (ms)" 
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#0d9488" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCalls)" 
                    name="API Calls" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pie Chart */}
          <Card 
            className="rounded-xl"
            header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Cost Chart</h2>}
          >
            <div className="h-[200px] w-full relative mt-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalCostData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {finalCostData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-md gap-y-sm mt-md">
              {finalCostData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-sm text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-500 font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-md">
          {/* Active SaaS Applications Table */}
          <Card 
            className="lg:col-span-3 rounded-xl"
            header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Active SaaS Applications</h2>}
          >
            <div className="overflow-x-auto mt-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-700 text-xs font-semibold text-slate-400">
                    <th className="py-sm">App Name</th>
                    <th className="py-sm">Status</th>
                    <th className="py-sm">Region</th>
                    <th className="py-sm">Users</th>
                    <th className="py-sm text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-700 text-body-sm text-neutral-800 dark:text-neutral-200">
                  <tr>
                    <td className="py-md font-medium">E-commerce Platform</td>
                    <td className="py-md">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-600 font-medium">Healthy</span>
                    </td>
                    <td className="py-md">us-east-1</td>
                    <td className="py-md">124</td>
                    <td className="py-md text-right">
                      <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 text-neutral-700 font-medium">Manage</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-md font-medium">HR Portal</td>
                    <td className="py-md">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-600 font-medium">Updating</span>
                    </td>
                    <td className="py-md">eu-central-1</td>
                    <td className="py-md">23</td>
                    <td className="py-md text-right">
                      <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100 text-neutral-700 font-medium">Manage</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Infrastructure Overview / AWS Services Grid */}
          <Card 
            className="lg:col-span-2 rounded-xl"
            header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Infrastructure Overview</h2>}
          >
            <div className="grid grid-cols-2 gap-md mt-md">
              <div className="p-md bg-orange-50/40 border border-orange-100 dark:border-neutral-700 dark:bg-neutral-800/20 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 dark:bg-orange-950/40 rounded-lg">
                  <Cpu className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400">EC2</h4>
                  <p className="text-body-md font-bold text-neutral-800 dark:text-white">
                    {data?.resources_by_type?.ec2 || 3} active
                  </p>
                </div>
              </div>

              <div className="p-md bg-blue-50/40 border border-blue-100 dark:border-neutral-700 dark:bg-neutral-800/20 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400">RDS</h4>
                  <p className="text-body-md font-bold text-neutral-800 dark:text-white">
                    {data?.resources_by_type?.rds || 1} active
                  </p>
                </div>
              </div>

              <div className="p-md bg-amber-50/40 border border-amber-100 dark:border-neutral-700 dark:bg-neutral-800/20 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400">Lambda</h4>
                  <p className="text-body-md font-bold text-neutral-800 dark:text-white">51M calls</p>
                </div>
              </div>

              <div className="p-md bg-emerald-50/40 border border-emerald-100 dark:border-neutral-700 dark:bg-neutral-800/20 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg">
                  <HardDrive className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400">S3</h4>
                  <p className="text-body-md font-bold text-neutral-800 dark:text-white">
                    {data?.resources_by_type?.s3 || 11} buckets
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
