import React from 'react'
import { X } from 'lucide-react'
import type { BadgeProps } from '../types/index'

const variantStyles = {
  success: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-100',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-100',
  error: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-100',
  info: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100',
  default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
}

const sizeStyles = {
  sm: 'px-2 py-1 text-xs font-medium',
  md: 'px-3 py-1.5 text-body-sm font-semibold',
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center gap-2 rounded-full
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        <span>{children}</span>
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 hover:opacity-70 transition-opacity"
            aria-label="Remove badge"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'
