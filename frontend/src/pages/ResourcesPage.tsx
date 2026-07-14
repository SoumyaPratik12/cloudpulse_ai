import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { DataTable } from '../components/DataTable'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { RefreshCw } from 'lucide-react'

export const ResourcesPage: React.FC = () => {
  const [resources, setResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [syncing, setSyncing] = React.useState(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')

  const fetchResources = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    try {
      const res = await fetch('/api/v1/resources/', {
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchResources()
  }, [])

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
      if (!res.ok) throw new Error('Failed to sync resources from AWS')
      const body = await res.json()
      setMessage(body.message || 'AWS resources sync triggered successfully!')
      fetchResources()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  const columns = [
    { key: 'resource_id', label: 'Resource ID' },
    { key: 'name', label: 'Name' },
    { key: 'resource_type', label: 'Type' },
    { key: 'state', label: 'State' },
    { key: 'cpu_utilization', label: 'CPU' },
    { key: 'monthly_cost', label: 'Monthly Cost' },
  ]

  const rows = resources.map(r => ({
    id: String(r.id),
    resource_id: r.resource_id,
    name: r.name || '-',
    resource_type: r.resource_type.toUpperCase(),
    state: r.state,
    cpu_utilization: r.cpu_utilization !== null ? `${r.cpu_utilization.toFixed(1)}%` : '-',
    monthly_cost: `$${r.monthly_cost.toFixed(2)}/mo`
  }))

  const runningCount = resources.filter(r => r.state === 'running' || r.state === 'available' || r.state === 'active').length
  const stoppedCount = resources.filter(r => r.state === 'stopped').length

  return (
    <DashboardLayout activeNavItem="resources">
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Resources</h1>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400">Manage your AWS infrastructure</p>
          </div>
          <Button 
            variant="primary" 
            isLoading={syncing}
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={handleSyncResources}
          >
            Sync AWS Resources
          </Button>
        </div>

        {error && (
          <Alert type="error" title="Synchronization Error" dismissible>
            {error}
          </Alert>
        )}

        {message && (
          <Alert type="success" title="Success" dismissible>
            {message}
          </Alert>
        )}

        <Alert type="info">
          Total resources: <strong>{resources.length}</strong> | Active: <strong>{runningCount}</strong> | Stopped: <strong>{stoppedCount}</strong>
        </Alert>

        <Card header={<h2 className="text-h3 font-semibold">All Resources</h2>}>
          {loading ? (
            <div className="p-lg text-center text-neutral-500">Loading resources list...</div>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
