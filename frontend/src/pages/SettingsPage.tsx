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
    organizationName: '',
    industry: 'technology',
    website: '',
    awsRegion: 'ap-south-1',
    accessKeyId: '',
    secretAccessKey: '',
    regions: 'ap-south-1,us-east-1',
    emailNotifications: true,
    slackNotifications: false,
  })

  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [successMessage, setSuccessMessage] = React.useState('')

  const fetchSettings = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    try {
      // 1. Fetch organization metadata
      const orgRes = await fetch('/api/v1/organizations/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (orgRes.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!orgRes.ok) throw new Error('Failed to load organization settings')
      const orgData = await orgRes.json()

      // 2. Fetch AWS credentials
      const credRes = await fetch('/api/v1/organizations/credentials', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      let credData = null
      if (credRes.ok) {
        credData = await credRes.json()
      }

      setFormData({
        organizationName: orgData.name || '',
        industry: orgData.industry || 'technology',
        website: orgData.website || '',
        awsRegion: orgData.default_aws_region || 'ap-south-1',
        accessKeyId: credData ? credData.access_key_id : '',
        secretAccessKey: credData ? '••••••••••••••••••••' : '', // Mask for safety
        regions: credData ? credData.regions : 'ap-south-1,us-east-1',
        emailNotifications: true,
        slackNotifications: false,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      // 1. Save Organization
      const orgRes = await fetch('/api/v1/organizations/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.organizationName,
          industry: formData.industry,
          website: formData.website,
          default_aws_region: formData.awsRegion,
        })
      })
      if (!orgRes.ok) throw new Error('Failed to update organization details')

      // 2. Save AWS credentials if keys are entered and not masked
      if (formData.accessKeyId && formData.secretAccessKey && formData.secretAccessKey !== '••••••••••••••••••••') {
        const credRes = await fetch('/api/v1/organizations/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            access_key_id: formData.accessKeyId,
            secret_access_key: formData.secretAccessKey,
            regions: formData.regions,
          })
        })
        if (!credRes.ok) throw new Error('Failed to update AWS credentials')
      }

      setSuccessMessage('Settings updated successfully!')
      fetchSettings()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout activeNavItem="settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-body-lg text-neutral-600 dark:text-neutral-400">Loading settings...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeNavItem="settings">
      <div className="space-y-lg max-w-2xl">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Settings</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">Manage your organization and preferences</p>
        </div>

        {error && (
          <Alert type="error" title="Settings Error" dismissible>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert type="success" title="Success" dismissible>
            {successMessage}
          </Alert>
        )}

        {/* Organization Settings */}
        <Card header={<h2 className="text-h3 font-semibold">Organization</h2>}>
          <div className="space-y-md">
            <FormField
              label="Organization Name"
              placeholder="Enter organization name"
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
            />

            <FormField
              label="Website"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
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

        {/* AWS Credentials */}
        <Card header={<h2 className="text-h3 font-semibold">AWS Credentials</h2>}>
          <Alert type="info" title="Secure Connection">
            Your AWS credentials are encrypted and stored securely. We only use them to analyze your infrastructure.
          </Alert>
          <div className="space-y-md mt-md">
            <FormField
              label="AWS Access Key ID"
              placeholder="AKIA..."
              value={formData.accessKeyId}
              onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
            />
            <FormField
              label="AWS Secret Access Key"
              placeholder="Enter your secret key"
              type="password"
              value={formData.secretAccessKey}
              onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
            />
            <FormField
              label="Target AWS Regions (comma-separated)"
              placeholder="ap-south-1,us-east-1"
              value={formData.regions}
              onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
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

        {/* Save Button */}
        <div className="flex justify-end gap-md pt-md">
          <Button variant="secondary" onClick={fetchSettings}>Cancel</Button>
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
