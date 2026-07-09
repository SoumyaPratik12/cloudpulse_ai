import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { ChartContainer } from '../components/ChartContainer'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { BarChart3, Zap, DollarSign, AlertCircle } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const chartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ]

  const costData = [
    { name: 'EC2', value: 4000 },
    { name: 'RDS', value: 3000 },
    { name: 'S3', value: 2000 },
    { name: 'Lambda', value: 2780 },
  ]

  return (
    <DashboardLayout activeNavItem="dashboard">
      <div className="space-y-lg">
        {/* Header */}
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Executive Dashboard</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">Monitor your cloud infrastructure at a glance</p>
        </div>

        {/* Alert */}
        <Alert type="warning" title="Attention Required" dismissible>
          You have 3 new recommendations that could save you up to $4,500 monthly.
        </Alert>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard
            label="Health Score"
            value={94}
            unit="/100"
            trend={5}
            trendLabel="vs last month"
            icon={<BarChart3 className="h-6 w-6 text-primary-600" />}
            backgroundColor="bg-primary-50 dark:bg-primary-900/20"
          />
          <StatCard
            label="Monthly Cost"
            value="$12,450"
            trend={-8}
            trendLabel="reduction"
            icon={<DollarSign className="h-6 w-6 text-success-600" />}
            backgroundColor="bg-success-50 dark:bg-success-900/20"
          />
          <StatCard
            label="Active Incidents"
            value={2}
            trend={-50}
            trendLabel="vs yesterday"
            icon={<AlertCircle className="h-6 w-6 text-error-600" />}
            backgroundColor="bg-error-50 dark:bg-error-900/20"
          />
          <StatCard
            label="Optimization Score"
            value={78}
            unit="%"
            trend={12}
            trendLabel="improvement"
            icon={<Zap className="h-6 w-6 text-warning-600" />}
            backgroundColor="bg-warning-50 dark:bg-warning-900/20"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <ChartContainer title="Monthly Cost Trend" data={chartData} type="line" />
          <ChartContainer title="Cost by Service" data={costData} type="pie" height={300} />
        </div>

        {/* Bottom section */}
        <div className="flex justify-end gap-md">
          <Button variant="secondary">Export Report</Button>
          <Button variant="primary">View Recommendations</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
