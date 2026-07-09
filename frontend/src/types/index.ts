export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode
  footer?: React.ReactNode
  hoverable?: boolean
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'md'
  removable?: boolean
  onRemove?: () => void
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away'
  backgroundColor?: string
}

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  title?: string
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  isDismissible?: boolean
  actions?: React.ReactNode
}

export interface DashboardData {
  healthScore: number
  monthlyCost: number
  costTrend: number
  activeIncidents: number
  topRecommendations: Recommendation[]
}

export interface Recommendation {
  id: string
  title: string
  description: string
  estimatedSavings: number
  priority: 'high' | 'medium' | 'low'
}

export interface Resource {
  id: string
  name: string
  type: 'ec2' | 'rds' | 's3' | 'lambda' | 'other'
  state: 'running' | 'stopped' | 'terminated'
  cpu?: number
  memory?: number
  uptime?: number
}
