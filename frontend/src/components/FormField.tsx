import React from 'react'
import { Input } from './Input'

interface FormFieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  type?: string
  placeholder?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  textarea?: boolean
  rows?: number
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      type = 'text',
      placeholder,
      name,
      value,
      onChange,
      textarea = false,
      rows = 4,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {textarea ? (
          <div>
            {label && (
              <label className="block text-body-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {label}
                {required && <span className="text-error-600 ml-1">*</span>}
              </label>
            )}
            <textarea
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              rows={rows}
              className={`
                w-full px-3 py-2 rounded-md border
                text-body-md bg-white dark:bg-neutral-800
                text-neutral-900 dark:text-neutral-50
                placeholder-neutral-400 dark:placeholder-neutral-600
                border-neutral-200 dark:border-neutral-700
                transition-smooth focus-ring
                ${error ? 'border-error-600' : ''}
                ${className}
              `}
            />
            {(error || helperText) && (
              <p className={`text-body-sm mt-1 ${error ? 'text-error-600' : 'text-neutral-500'}`}>
                {error || helperText}
              </p>
            )}
          </div>
        ) : (
          <Input
            type={type}
            label={label}
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            error={error}
            helperText={helperText}
            required={required}
          />
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
