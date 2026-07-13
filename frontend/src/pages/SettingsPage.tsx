import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Alert } from '../components/Alert'
import { Select } from '../components/Select'
import { Checkbox } from '../components/Checkbox'
import { Save } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [formData, setFormData] = React.useState({
    organizationName: 'Acme Corp',
    industry: 'technology',
    emailNotifications: true,
    slackNotifications: false,
    awsRegion: 'ap-south-1',
  })

  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <DashboardLayout activeNavItem="settings">
      <div className="space-y-lg max-w-2xl">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Settings</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">Manage your organization and preferences</p>
        </div>

        {/* Organization Settings */}
        <Card header={<h2 className="text-h3 font-semibold">Organization</h2>}>
          <div className="space-y-md">
            <FormField
              label="Organization Name"
              placeholder="Enter organization name"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
            />

            <Select
              label="Industry"
              value={formData.industry}
              options={[
                { value: 'technology', label: 'Technology' },
                { value: 'finance', label: 'Finance' },
                { value: 'healthcare', label: 'Healthcare' },
                { value: 'retail', label: 'Retail' },
              ]}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />

            <Select
              label="Default AWS Region"
              value={formData.awsRegion}
              options={[
                { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
                { value: 'us-east-1', label: 'US East (N. Virginia)' },
                { value: 'us-west-2', label: 'US West (Oregon)' },
                { value: 'eu-west-1', label: 'EU (Ireland)' },
                { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
              ]}
              onChange={(e) => setFormData({ ...formData, awsRegion: e.target.value })}
            />
          </div>
        </Card>

        {/* Notification Settings */}
        <Card header={<h2 className="text-h3 font-semibold">Notifications</h2>}>
          <div className="space-y-md">
            <Checkbox
              label="Email Notifications"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
            />
            <Checkbox
              label="Slack Notifications"
              checked={formData.slackNotifications}
              onChange={(e) => setFormData({ ...formData, slackNotifications: e.target.checked })}
            />
          </div>
        </Card>

        {/* AWS Credentials */}
        <Card header={<h2 className="text-h3 font-semibold">AWS Credentials</h2>}>
          <Alert type="info" title="Secure Connection">
            Your AWS credentials are encrypted and stored securely. We only use them to analyze your infrastructure.
          </Alert>
          <div className="mt-md pt-md border-t border-neutral-200 dark:border-neutral-700">
            <Button variant="secondary">Update AWS Credentials</Button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-md pt-md">
          <Button variant="secondary">Cancel</Button>
          <Button
            variant="primary"
            icon={<Save className="h-4 w-4" />}
            isLoading={isSaving}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
