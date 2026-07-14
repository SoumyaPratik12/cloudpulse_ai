import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { ChartContainer } from '../components/ChartContainer'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { BarChart3, Zap, DollarSign, AlertCircle } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [remediatingId, setRemediatingId] = React.useState<number | null>(null)

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

      // Auto-trigger sync if the environment is blank (no cost, no recommendations)
      if (body.monthly_cost === 0 && (!body.recommendations || body.recommendations.length === 0)) {
        console.log("No resources found. Bootstrapping AWS sync in background...")
        fetch('/api/v1/resources/sync', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => {
          // Re-fetch after sync completes
          fetch('/api/v1/dashboard/executive', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()).then(newData => setData(newData))
        }).catch(e => console.error("Auto-sync failed", e))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleApplyRecommendation = async (id: number) => {
    const token = localStorage.getItem('token')
    setRemediatingId(id)
    try {
      const res = await fetch(`/api/v1/recommendations/${id}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to apply remediation action')
      const result = await res.json()
      alert(result.message || 'Action executed successfully!')
      fetchDashboardData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setRemediatingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout activeNavItem="dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-body-lg text-neutral-600 dark:text-neutral-400">Loading CloudPulse Dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  const chartData = [
    { name: 'Jan', value: (data?.monthly_cost || 120.0) * 0.8 },
    { name: 'Feb', value: (data?.monthly_cost || 120.0) * 0.9 },
    { name: 'Mar', value: (data?.monthly_cost || 120.0) * 1.1 },
    { name: 'Apr', value: (data?.monthly_cost || 120.0) * 1.05 },
    { name: 'May', value: (data?.monthly_cost || 120.0) * 0.95 },
    { name: 'Jun', value: data?.monthly_cost || 120.0 },
  ]

  const costData = Object.entries(data?.resources_by_type || {}).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: Number(val) * 10
  }))

  const finalCostData = costData.length > 0 ? costData : [
    { name: 'EC2', value: 40 },
    { name: 'RDS', value: 30 },
    { name: 'S3', value: 20 },
  ]

  return (
    <DashboardLayout activeNavItem="dashboard">
      <div className="space-y-lg">
        {/* Header */}
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Executive Dashboard</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">Monitor your cloud infrastructure at a glance</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" title="Dashboard Error" dismissible>
            {error}
          </Alert>
        )}

        {/* Alert */}
        {data?.recommendations?.length > 0 && (
          <Alert type="warning" title="Attention Required" dismissible>
            You have {data.recommendations.length} recommendations that could optimize your infrastructure costs.
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard
            label="Health Score"
            value={data?.health_score || 100}
            unit="/100"
            trend={5}
            trendLabel="vs last month"
            icon={<BarChart3 className="h-6 w-6 text-primary-600" />}
            backgroundColor="bg-primary-50 dark:bg-primary-900/20"
          />
          <StatCard
            label="Monthly Cost"
            value={`$${(data?.monthly_cost || 0.0).toFixed(2)}`}
            trend={-8}
            trendLabel="reduction"
            icon={<DollarSign className="h-6 w-6 text-success-600" />}
            backgroundColor="bg-success-50 dark:bg-success-900/20"
          />
          <StatCard
            label="Active Recommendations"
            value={data?.recommendations?.length || 0}
            trend={-50}
            trendLabel="vs yesterday"
            icon={<AlertCircle className="h-6 w-6 text-error-600" />}
            backgroundColor="bg-error-50 dark:bg-error-900/20"
          />
          <StatCard
            label="Optimization Status"
            value={data?.recommendations?.length > 0 ? "Needs Review" : "Fully Optimized"}
            icon={<Zap className="h-6 w-6 text-warning-600" />}
            backgroundColor="bg-warning-50 dark:bg-warning-900/20"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <ChartContainer title="Monthly Cost Trend" data={chartData} type="line" />
          <ChartContainer title="Cost by Service" data={finalCostData} type="pie" height={300} />
        </div>

        {/* Active Recommendations */}
        <Card header={<h2 className="text-h3 font-semibold text-neutral-900 dark:text-white">Active Recommendations</h2>}>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {data?.recommendations?.map((rec: any) => (
              <div key={rec.id} className="py-md flex items-center justify-between">
                <div>
                  <h3 className="text-body-lg font-semibold text-neutral-800 dark:text-neutral-200">{rec.title}</h3>
                  <p className="text-body-sm text-neutral-500">Savings: <span className="font-semibold text-success-600">${rec.estimated_savings}/mo</span> | Priority: <span className="uppercase font-semibold">{rec.priority}</span></p>
                </div>
                <Button 
                  size="sm" 
                  variant="primary"
                  isLoading={remediatingId === rec.id}
                  onClick={() => handleApplyRecommendation(rec.id)}
                >
                  Apply
                </Button>
              </div>
            ))}
            {!data?.recommendations?.length && (
              <p className="text-neutral-500 py-md">No open recommendations. Your cloud is fully optimized!</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
