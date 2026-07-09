import React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const id = React.useId()

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={`
              h-4 w-4 rounded border-neutral-300 text-primary-600
              focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              cursor-pointer transition-smooth
              ${error ? 'border-error-600' : ''}
              ${className}
            `}
            {...props}
          />
          {label && (
            <label htmlFor={id} className="text-body-md text-neutral-700 dark:text-neutral-300 cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-body-sm text-error-600">{error}</p>}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const id = React.useId()

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type="radio"
            id={id}
            className={`
              h-4 w-4 border-neutral-300 text-primary-600
              focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              cursor-pointer transition-smooth
              ${error ? 'border-error-600' : ''}
              ${className}
            `}
            {...props}
          />
          {label && (
            <label htmlFor={id} className="text-body-md text-neutral-700 dark:text-neutral-300 cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-body-sm text-error-600">{error}</p>}
      </div>
    )
  }
)

Radio.displayName = 'Radio'
