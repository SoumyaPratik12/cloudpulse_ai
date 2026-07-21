import React from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { StatCard } from '../components/StatCard'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
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
  ShieldCheck, 
  DollarSign, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  RefreshCw,
  Loader2
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

interface TeamMember {
  id: string
  name: string
  role: string
  permissions: string
  lastLogin: string
  status: 'active' | 'inactive'
}

const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Administrator Ava', role: 'CEO / Admin', permissions: 'Super Admin', lastLogin: '2 min ago', status: 'active' },
  { id: '2', name: 'DevOps Liam', role: 'Lead SRE', permissions: 'Read/Write Infrastructure', lastLogin: '1 hour ago', status: 'active' },
  { id: '3', name: 'Developer Noah', role: 'Backend Engineer', permissions: 'Read-only Resources', lastLogin: '3 days ago', status: 'active' },
  { id: '4', name: 'Security Emma', role: 'CISO / Auditor', permissions: 'Read/Write IAM & Audits', lastLogin: '15 min ago', status: 'active' },
]

interface PolicyItem {
  id: string
  label: string
  enabled: boolean
}

const INITIAL_POLICIES: PolicyItem[] = [
  { id: 'mfa', label: 'MFA Enabled (Root Account)', enabled: true },
  { id: 'encrypt', label: 'EBS/S3 Data Encryption Enforced', enabled: true },
  { id: 'tls', label: 'TLS 1.3/HTTPS Enforced on ALB', enabled: true },
  { id: 'backups', label: 'Automated Daily Backup Policy', enabled: true },
  { id: 'rotation', label: '90-Day IAM Key Rotation Policy', enabled: false },
  { id: 'logging', label: 'CloudTrail Logging & Audits Enabled', enabled: true },
  { id: 'retention', label: '7-Year S3 Glacier Archival Retention', enabled: false },
]

interface SecurityLog {
  time: string
  event: string
  actor: string
  severity: 'low' | 'medium' | 'high'
}

const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  { time: '10:45 AM', event: 'Encryption disabled on test-S3-bucket', actor: 'Developer Noah', severity: 'high' },
  { time: '09:30 AM', event: 'IAM Role updated: SRE access keys', actor: 'Administrator Ava', severity: 'medium' },
  { time: 'Yesterday', event: 'Failed login attempt from IP 192.168.1.14', actor: 'Unknown', severity: 'high' },
  { time: 'Yesterday', event: 'Backup completed successfully for RDS instance', actor: 'System', severity: 'low' },
  { time: '2 days ago', event: 'MFA reset for DevOps Liam', actor: 'Administrator Ava', severity: 'medium' },
]

interface DriftItem {
  id: string
  name: string
  expected: string
  actual: string
  severity: 'high' | 'medium'
  status: 'drifted' | 'in_sync'
}

export const GovernancePage: React.FC = () => {
  const [team, setTeam] = React.useState<TeamMember[]>(INITIAL_TEAM)
  const [policies, setPolicies] = React.useState<PolicyItem[]>(INITIAL_POLICIES)
  const [logsList, setLogsList] = React.useState<SecurityLog[]>(INITIAL_SECURITY_LOGS)
  const [activeSecurityTab, setActiveSecurityTab] = React.useState<'policies' | 'drift'>('policies')
  
  // Drift states
  const [isScanning, setIsScanning] = React.useState(false)
  const [remediatingId, setRemediatingId] = React.useState<string | null>(null)
  const [driftItems, setDriftItems] = React.useState<DriftItem[]>([
    { id: '1', name: 'aws_security_group.allow_tls', expected: 'Port 443 inbound only', actual: 'Port 22 open to 0.0.0.0/0', severity: 'high', status: 'drifted' },
    { id: '2', name: 'aws_s3_bucket.cloudpulse_assets', expected: 'Versioning Enabled', actual: 'Versioning Disabled', severity: 'medium', status: 'drifted' },
    { id: '3', name: 'aws_db_instance.rds_master', expected: 'Storage Encrypted: true', actual: 'Storage Encrypted: false', severity: 'high', status: 'drifted' },
  ])

  const handleDeactivate = (id: string) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m))
  }

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))
  }

  const handleScanDrift = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      // Reset items back to drifted state for demonstration/testing loop
      setDriftItems([
        { id: '1', name: 'aws_security_group.allow_tls', expected: 'Port 443 inbound only', actual: 'Port 22 open to 0.0.0.0/0', severity: 'high', status: 'drifted' },
        { id: '2', name: 'aws_s3_bucket.cloudpulse_assets', expected: 'Versioning Enabled', actual: 'Versioning Disabled', severity: 'medium', status: 'drifted' },
        { id: '3', name: 'aws_db_instance.rds_master', expected: 'Storage Encrypted: true', actual: 'Storage Encrypted: false', severity: 'high', status: 'drifted' },
      ])
    }, 1500)
  }

  const handleRemediate = (id: string, name: string) => {
    setRemediatingId(id)
    setTimeout(() => {
      setDriftItems(prev => prev.map(item => item.id === id ? { ...item, status: 'in_sync' } : item))
      setRemediatingId(null)
      // Add event log
      const newLog = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: `Remediated config drift on resource: ${name}`,
        actor: 'Administrator Ava',
        severity: 'low' as const
      }
      setLogsList(prev => [newLog, ...prev])
    }, 2000)
  }

  // Calculate compliance score
  const enabledCount = policies.filter(p => p.enabled).length
  const driftSyncCount = driftItems.filter(d => d.status === 'in_sync').length
  const complianceScore = Math.round(((enabledCount + driftSyncCount) / (policies.length + driftItems.length)) * 100)

  return (
    <DashboardLayout activeNavItem="security">
      <div className="space-y-lg">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Governance Center</h1>
          <p className="text-body-md text-neutral-600 dark:text-neutral-400">Manage financial metrics, cloud policies, and security operations</p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
          <StatCard
            label="Compliance Score"
            value={`${complianceScore}%`}
            trendLabel="Audit Standard: SOC2"
            icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Actual Spend (MTD)"
            value="$3,900"
            trend={-7}
            trendLabel="vs projected target"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Total Team Members"
            value={`${team.length}`}
            trendLabel="4 Active Roles assigned"
            icon={<Users className="h-5 w-5 text-sky-600" />}
            backgroundColor="bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-xl"
          />
          <StatCard
            label="Security Incidents"
            value={`${driftItems.filter(d => d.status === 'drifted').length} Pending`}
            trendLabel="Drifted resources detected"
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
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

        {/* Security & Policies Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-md">
          {/* Policy Checklist & Drift Tabs */}
          <Card 
            className="lg:col-span-2 rounded-xl flex flex-col"
            header={
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveSecurityTab('policies')}
                    className={`pb-1 text-xs font-bold uppercase border-b-2 transition-all ${activeSecurityTab === 'policies' ? 'border-sky-500 text-sky-600' : 'border-transparent text-neutral-400'}`}
                  >
                    Policies
                  </button>
                  <button 
                    onClick={() => setActiveSecurityTab('drift')}
                    className={`pb-1 text-xs font-bold uppercase border-b-2 transition-all ${activeSecurityTab === 'drift' ? 'border-sky-500 text-sky-600' : 'border-transparent text-neutral-400'}`}
                  >
                    Drift ({driftItems.filter(d => d.status === 'drifted').length})
                  </button>
                </div>
                {activeSecurityTab === 'drift' && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="p-1 text-neutral-500 border hover:bg-slate-100 flex items-center gap-1"
                    onClick={handleScanDrift}
                    disabled={isScanning}
                  >
                    <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                    Scan
                  </Button>
                )}
              </div>
            }
          >
            {activeSecurityTab === 'policies' ? (
              <div className="space-y-md mt-md">
                {policies.map(policy => (
                  <div 
                    key={policy.id} 
                    onClick={() => togglePolicy(policy.id)}
                    className="flex items-center justify-between p-sm bg-slate-50 dark:bg-neutral-800/40 rounded-lg border border-slate-100 dark:border-neutral-700/60 cursor-pointer hover:bg-slate-100/55 transition-colors"
                  >
                    <span className="text-body-sm font-medium text-neutral-800 dark:text-neutral-200">{policy.label}</span>
                    <div>
                      {policy.enabled ? (
                        <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold"><CheckCircle className="h-4 w-4" /> Active</span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1 text-xs font-semibold"><XCircle className="h-4 w-4" /> Disabled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-md mt-md flex-1">
                {isScanning ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    <span className="text-xs font-semibold">Auditing active AWS resource mappings...</span>
                  </div>
                ) : (
                  <div className="space-y-sm">
                    {driftItems.map(item => (
                      <div key={item.id} className="p-sm bg-slate-50 dark:bg-neutral-900/50 rounded-xl border border-slate-100 dark:border-neutral-700/60 text-xs flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{item.name}</span>
                          {item.status === 'drifted' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold uppercase animate-pulse">Drifted</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase">In Sync</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-sm text-[11px] text-slate-500">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Expected</span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{item.expected}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Actual</span>
                            <span className="font-semibold text-red-500 dark:text-red-400">{item.status === 'drifted' ? item.actual : item.expected}</span>
                          </div>
                        </div>
                        {item.status === 'drifted' && (
                          <div className="flex justify-end mt-1">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="text-xs bg-white hover:bg-slate-50 text-sky-600 font-bold border border-slate-200 py-1"
                              onClick={() => handleRemediate(item.id, item.name)}
                              disabled={remediatingId !== null}
                            >
                              {remediatingId === item.id ? (
                                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Remediating...</span>
                              ) : 'Remediate Config'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Security Log */}
          <Card className="lg:col-span-3 rounded-xl" header={<h2 className="text-h4 font-bold text-neutral-800 dark:text-white">Security Event Log</h2>}>
            <div className="overflow-y-auto max-h-[380px] mt-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-700 text-xs font-semibold text-slate-400">
                    <th className="py-sm">Time</th>
                    <th className="py-sm">Event Description</th>
                    <th className="py-sm">Actor</th>
                    <th className="py-sm text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-700 text-body-sm text-neutral-800 dark:text-neutral-200">
                  {logsList.map((log, index) => (
                    <tr key={index}>
                      <td className="py-md text-neutral-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {log.time}</td>
                      <td className="py-md font-medium">{log.event}</td>
                      <td className="py-md">{log.actor}</td>
                      <td className="py-md text-right">
                        {log.severity === 'high' ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-600 font-bold uppercase">High</span>
                        ) : log.severity === 'medium' ? (
                          <span className="px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-600 font-bold uppercase">Medium</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs rounded bg-slate-50 text-slate-600 font-bold uppercase">Low</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Team Management */}
        <Card header={<h2 className="text-h3 font-bold text-neutral-800 dark:text-white">Team & RBAC Security</h2>}>
          <div className="overflow-x-auto mt-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-700 text-xs font-semibold text-slate-400">
                  <th className="py-sm">Name</th>
                  <th className="py-sm">Role</th>
                  <th className="py-sm">IAM Permissions</th>
                  <th className="py-sm">Last Active</th>
                  <th className="py-sm">Status</th>
                  <th className="py-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-700 text-body-sm text-neutral-800 dark:text-neutral-200">
                {team.map(member => (
                  <tr key={member.id}>
                    <td className="py-md font-semibold flex items-center gap-2"><UserCheck className="h-4 w-4 text-sky-500" /> {member.name}</td>
                    <td className="py-md">{member.role}</td>
                    <td className="py-md"><code className="px-1.5 py-0.5 bg-slate-100 dark:bg-neutral-800 rounded text-xs">{member.permissions}</code></td>
                    <td className="py-md text-neutral-500">{member.lastLogin}</td>
                    <td className="py-md">
                      {member.status === 'active' ? (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-600 font-medium">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 text-slate-500 font-medium">Suspended</span>
                      )}
                    </td>
                    <td className="py-md text-right space-x-sm">
                      <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100" onClick={() => handleDeactivate(member.id)}>
                        {member.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="secondary" size="sm" className="bg-slate-50 border hover:bg-slate-100">
                        Reset MFA
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
