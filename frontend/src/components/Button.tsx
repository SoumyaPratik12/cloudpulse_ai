import React from 'react'
import { Loader2 } from 'lucide-react'
import type { ButtonProps } from '../types/index'

const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400 dark:bg-neutral-700 dark:text-neutral-50 dark:hover:bg-neutral-600',
  tertiary: 'bg-transparent text-primary-600 border border-primary-600 hover:bg-primary-50 active:bg-primary-100 dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-950',
  danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-800',
}

const sizeStyles = {
  sm: 'h-8 px-3 text-button-sm',
  md: 'h-10 px-4 text-button-md',
  lg: 'h-12 px-5 text-button-lg',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2 rounded-md font-medium
          transition-smooth cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-ring
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && icon && iconPosition === 'left' && icon}
        {children}
        {!isLoading && icon && iconPosition === 'right' && icon}
      </button>
    )
  }
)

Button.displayName = 'Button'
