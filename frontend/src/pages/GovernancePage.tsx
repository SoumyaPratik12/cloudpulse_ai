import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
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
  DollarSign, 
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'

// Dummy historical data for Billing Engine
const billingTrendData = [
  { name: 'Jan', actual: 4500, projected: 4800 },
  { name: 'Feb', actual: 5100, projected: 4900 },
  { name: 'Mar', actual: 4800, projected: 5000 },
  { name: 'Apr', actual: 4200, projected: 5100 },
  { name: 'May', actual: 3800, projected: 5200 },
  { name: 'Jun', actual: 3900, projected: 5300 },
]

const departmentCostData = [
  { name: 'Engineering', value: 12000 },
  { name: 'Product', value: 4500 },
  { name: 'Security', value: 3000 },
  { name: 'Operations', value: 8000 },
]

const COLORS = ['#0284c7', '#0d9488', '#8b5cf6', '#f59e0b']

export const GovernancePage: React.FC = () => {
  const [syncing, setSyncing] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState('')

  const handleSyncBillingData = () => {
    setSyncing(true)
    setSuccessMsg('')
    setTimeout(() => {
      setSyncing(false)
      setSuccessMsg('Cost Explorer billing logs synchronized successfully!')
    }, 1500)
  }

  return (
    <DashboardLayout activeNavItem="billing">
      <div className="space-y-lg">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Cloud Billing & Cost Governance</h1>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400">Manage cloud financial metrics, budget targets, and cost allocation charts</p>
          </div>
          <Button 
            variant="primary" 
            isLoading={syncing}
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleSyncBillingData}
          >
            Sync Cost Explorer
          </Button>
        </div>

        {successMsg && <Alert type="success" title="Success" dismissible>{successMsg}</Alert>}

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard
            label="Actual Spend (MTD)"
            value="$3,900"
            trend={-7}
            trendLabel="vs projected target"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Projected Monthly Run"
            value="$5,300"
            trend={4}
            trendLabel="vs last month"
            icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Cost Savings Forecast"
            value="$480.00"
            trendLabel="Glacier transition savings"
            icon={<TrendingDown className="h-5 w-5 text-emerald-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Optimization Score"
            value="92%"
            trendLabel="Grade: High efficiency"
            icon={<Activity className="h-5 w-5 text-emerald-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
        </div>

        {/* Billing & Cost Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Spend comparison chart */}
          <Card className="lg:col-span-2 rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Billing Engine (Spend vs Budget)</h2>}>
            <div className="h-[280px] w-full mt-md">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={billingTrendData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="actual" stroke="#0284c7" strokeWidth={2} fill="url(#colorActual)" name="Actual Spend ($)" />
                  <Area type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Projected Cost ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Department Breakdown */}
          <Card className="rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Department Cost Breakdowns</h2>}>
            <div className="h-[180px] w-full mt-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentCostData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                  >
                    {departmentCostData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-sm mt-md">
              {departmentCostData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-body-sm">
                  <div className="flex items-center gap-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600 dark:text-neutral-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-100">${item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Cost Optimization Recommendations */}
        <Card header={<h2 className="text-h3 font-bold text-neutral-800 dark:text-white">Cost Reduction Proposals</h2>}>
          <div className="space-y-md mt-md">
            <div className="p-md bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/35 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Move cloudpulse-static-assets-prod S3 Objects to Glacier
                </div>
                <div className="text-slate-500 mt-1">Archiving telemetry logs older than 90 days drops storage costs by $115.00/mo.</div>
              </div>
              <Button size="sm" variant="secondary" className="bg-white border hover:bg-slate-50 font-bold text-emerald-700">Approve Proposal</Button>
            </div>
            <div className="p-md bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/35 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Rightsize cloudpulse-worker-node-02 Instance
                </div>
                <div className="text-slate-500 mt-1">Current worker node utilizes less than 15% memory average. Downgrade instance size to save $35.00/mo.</div>
              </div>
              <Button size="sm" variant="secondary" className="bg-white border hover:bg-slate-50 font-bold text-amber-700">Approve Proposal</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
