import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { DataTable } from '../components/DataTable'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Plus } from 'lucide-react'

export const ResourcesPage: React.FC = () => {
  const resources = [
    {
      id: '1',
      name: 'web-server-prod',
      type: 'EC2',
      state: 'running',
      cost: '$450/mo',
      cpu: '45%',
      memory: '62%',
    },
    {
      id: '2',
      name: 'database-primary',
      type: 'RDS',
      state: 'running',
      cost: '$680/mo',
      cpu: '28%',
      memory: '71%',
    },
    {
      id: '3',
      name: 'backup-storage',
      type: 'S3',
      state: 'running',
      cost: '$120/mo',
      cpu: '-',
      memory: '-',
    },
    {
      id: '4',
      name: 'dev-instance',
      type: 'EC2',
      state: 'stopped',
      cost: '$0/mo',
      cpu: '-',
      memory: '-',
    },
  ]

  const columns = [
    { key: 'name', label: 'Resource Name' },
    { key: 'type', label: 'Type' },
    { key: 'state', label: 'State' },
    { key: 'cpu', label: 'CPU' },
    { key: 'memory', label: 'Memory' },
    { key: 'cost', label: 'Monthly Cost' },
  ]

  return (
    <DashboardLayout activeNavItem="resources">
      <div className="space-y-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Resources</h1>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400">Manage your AWS infrastructure</p>
          </div>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
            Add Resource
          </Button>
        </div>

        <Alert type="info">
          Total resources: <strong>4</strong> | Running: <strong>3</strong> | Stopped: <strong>1</strong>
        </Alert>

        <Card header={<h2 className="text-h3 font-semibold">All Resources</h2>}>
          <DataTable columns={columns} rows={resources} />
        </Card>
      </div>
    </DashboardLayout>
  )
}
