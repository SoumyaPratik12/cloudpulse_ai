import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { FormField } from '../components/FormField'
import { Alert } from '../components/Alert'
import { Select } from '../components/Select'
import { Checkbox } from '../components/Checkbox'
import { Save, Unplug, ShieldAlert, Key } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [formData, setFormData] = React.useState({
    organizationName: '',
    industry: 'technology',
    website: '',
    awsRegion: 'ap-south-1',
    accessKeyId: '',
    secretAccessKey: '',
    roleArn: '',
    externalId: '',
    regions: 'ap-south-1,us-east-1',
    emailNotifications: true,
    slackNotifications: false,
  })

  const [loading, setLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isRevoking, setIsRevoking] = React.useState(false)
  const [error, setError] = React.useState('')
  const [successMessage, setSuccessMessage] = React.useState('')
  const [isTesting, setIsTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string; arn?: string } | null>(null)
  const [connectionType, setConnectionType] = React.useState<'role' | 'keys'>('role')

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/v1/organizations/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          access_key_id: connectionType === 'keys' ? formData.accessKeyId : undefined,
          secret_access_key: connectionType === 'keys' ? formData.secretAccessKey : undefined,
          role_arn: connectionType === 'role' ? formData.roleArn : undefined,
          external_id: connectionType === 'role' ? formData.externalId : undefined,
          regions: formData.regions
        })
      })
      const body = await res.json()
      if (res.ok) {
        setTestResult({
          success: true,
          message: body.message,
          arn: body.arn
        })
      } else {
        setTestResult({
          success: false,
          message: body.detail || 'Connection failed.'
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed.'
      })
    } finally {
      setIsTesting(false)
    }
  }

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

      if (credData) {
        setFormData({
          organizationName: orgData.name || '',
          industry: orgData.industry || 'technology',
          website: orgData.website || '',
          awsRegion: orgData.default_aws_region || 'ap-south-1',
          accessKeyId: credData.access_key_id || '',
          secretAccessKey: credData.access_key_id ? '••••••••••••••••••••' : '',
          roleArn: credData.role_arn || '',
          externalId: credData.external_id || '',
          regions: credData.regions || 'ap-south-1,us-east-1',
          emailNotifications: true,
          slackNotifications: false,
        })
        if (credData.role_arn) {
          setConnectionType('role')
        } else if (credData.access_key_id) {
          setConnectionType('keys')
        }
      } else {
        setFormData({
          organizationName: orgData.name || '',
          industry: orgData.industry || 'technology',
          website: orgData.website || '',
          awsRegion: orgData.default_aws_region || 'ap-south-1',
          accessKeyId: '',
          secretAccessKey: '',
          roleArn: '',
          externalId: '',
          regions: 'ap-south-1,us-east-1',
          emailNotifications: true,
          slackNotifications: false,
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeConnection = async () => {
    if (!confirm('Are you sure you want to revoke the AWS connection? All resource synchronization records will be wiped instantly from the database.')) return
    setIsRevoking(true)
    setError('')
    setSuccessMessage('')
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/v1/organizations/credentials', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to revoke credentials')
      setSuccessMessage('AWS connection revoked successfully!')
      setTestResult(null)
      fetchSettings()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsRevoking(false)
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

      // 2. Save AWS credentials
      const credRes = await fetch('/api/v1/organizations/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          access_key_id: connectionType === 'keys' ? formData.accessKeyId : null,
          secret_access_key: connectionType === 'keys' && formData.secretAccessKey !== '••••••••••••••••••••' ? formData.secretAccessKey : null,
          role_arn: connectionType === 'role' ? formData.roleArn : null,
          external_id: connectionType === 'role' ? formData.externalId : null,
          regions: formData.regions,
        })
      })
      if (!credRes.ok) throw new Error('Failed to update AWS credentials')

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

  const isConnected = !!(formData.roleArn || formData.accessKeyId)

  return (
    <DashboardLayout activeNavItem="settings">
      <div className="space-y-lg max-w-2xl">
        <div>
          <h1 className="text-h1 font-bold text-neutral-900 dark:text-white mb-2">Settings</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400 font-medium">Manage your organization and preferences</p>
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
        <Card header={<h2 className="text-h3 font-semibold">AWS Connection</h2>}>
          <Alert type="info" title="Zero long-lived credentials stored (STS)">
            <div className="text-xs space-y-1">
              <div>To connect your AWS account, configure a trusted IAM Role with read/write access. CloudPulse utilizes time-boxed STS session tokens to analyze and provision resources.</div>
              <div className="font-semibold mt-1">
                Status: {isConnected ? "✅ Connected" : "❌ Disconnected (Using Mock Telemetry)"}
              </div>
            </div>
          </Alert>

          {/* Connection Type Tabs */}
          <div className="flex bg-slate-100 dark:bg-neutral-800 rounded-xl p-1 text-xs border border-slate-200/60 dark:border-neutral-700 mt-md">
            <button
              onClick={() => setConnectionType('role')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${connectionType === 'role' ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-neutral-500'}`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              IAM Role (Recommended)
            </button>
            <button
              onClick={() => setConnectionType('keys')}
              className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${connectionType === 'keys' ? 'bg-white dark:bg-neutral-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-neutral-500'}`}
            >
              <Key className="h-3.5 w-3.5" />
              Access Keys
            </button>
          </div>

          <div className="space-y-md mt-md">
            {connectionType === 'role' ? (
              <>
                <FormField
                  label="IAM Role ARN"
                  placeholder="arn:aws:iam::123456789012:role/CloudPulseCrossAccountRole"
                  value={formData.roleArn}
                  onChange={(e) => setFormData({ ...formData, roleArn: e.target.value })}
                />
                <FormField
                  label="IAM External ID"
                  placeholder="Optional external ID parameter"
                  value={formData.externalId}
                  onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                />
              </>
            ) : (
              <>
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
              </>
            )}

            <FormField
              label="Target AWS Regions (comma-separated)"
              placeholder="ap-south-1,us-east-1"
              value={formData.regions}
              onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
            />

            <div className="flex flex-col gap-2 pt-md border-t border-slate-100 dark:border-neutral-700/60 mt-md">
              <div className="flex justify-between items-center gap-md">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 font-bold"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                >
                  Test Connection
                </Button>
                {isConnected && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                    onClick={handleRevokeConnection}
                    isLoading={isRevoking}
                    icon={<Unplug className="h-3.5 w-3.5" />}
                  >
                    Revoke AWS Connection
                  </Button>
                )}
              </div>
              {testResult && (
                <div className={`p-sm rounded-lg text-xs mt-2 font-medium ${testResult.success ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/30'}`}>
                  <div className="font-bold mb-1">{testResult.success ? '✓ Connection Successful' : '✗ Connection Failed'}</div>
                  <div>{testResult.message}</div>
                  {testResult.arn && <code className="block mt-1 font-mono text-[10px] break-all">{testResult.arn}</code>}
                </div>
              )}
            </div>
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
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
