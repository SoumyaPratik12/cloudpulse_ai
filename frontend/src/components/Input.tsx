import React from 'react'
import type { InputProps } from '../types/index'

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const hasError = !!error

    return (
      <div className="w-full">
        {label && (
          <label className="block text-body-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            {label}
            {required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full h-10 px-3 rounded-md border
              text-body-md bg-white dark:bg-neutral-800
              text-neutral-900 dark:text-neutral-50
              placeholder-neutral-400 dark:placeholder-neutral-600
              transition-smooth
              focus-ring
              ${hasError ? 'border-error-600' : 'border-neutral-200 dark:border-neutral-700'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            disabled={disabled}
            {...props}
          />
          
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p className={`text-body-sm mt-1 ${hasError ? 'text-error-600' : 'text-neutral-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
