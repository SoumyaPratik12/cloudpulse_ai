import React from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { AlertProps } from '../types/index'

const typeStyles = {
  success: { bg: 'bg-success-50 dark:bg-success-950', border: 'border-success-200 dark:border-success-800', text: 'text-success-900 dark:text-success-100', icon: <CheckCircle className="h-5 w-5 text-success-600" /> },
  error: { bg: 'bg-error-50 dark:bg-error-950', border: 'border-error-200 dark:border-error-800', text: 'text-error-900 dark:text-error-100', icon: <AlertCircle className="h-5 w-5 text-error-600" /> },
  warning: { bg: 'bg-warning-50 dark:bg-warning-950', border: 'border-warning-200 dark:border-warning-800', text: 'text-warning-900 dark:text-warning-100', icon: <AlertTriangle className="h-5 w-5 text-warning-600" /> },
  info: { bg: 'bg-primary-50 dark:bg-primary-950', border: 'border-primary-200 dark:border-primary-800', text: 'text-primary-900 dark:text-primary-100', icon: <Info className="h-5 w-5 text-primary-600" /> },
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type = 'info',
      title,
      dismissible = false,
      onDismiss,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(true)

    const handleDismiss = () => {
      setIsVisible(false)
      onDismiss?.()
    }

    if (!isVisible) return null

    const style = typeStyles[type]

    return (
      <div
        ref={ref}
        className={`
          flex gap-3 p-4 rounded-md border
          ${style.bg} ${style.border} ${style.text}
          ${className}
        `}
        {...props}
      >
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        
        <div className="flex-1">
          {title && <h3 className="font-semibold text-body-md mb-1">{title}</h3>}
          <div className="text-body-sm">{children}</div>
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }
)

Alert.displayName = 'Alert'
