import React from 'react'
import type { AvatarProps } from '../types/index'

const sizeStyles = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg',
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      initials = '?',
      size = 'md',
      status,
      backgroundColor = 'bg-primary-500',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {src ? (
          <img src={src} alt={initials} className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className={`${backgroundColor} text-white font-semibold flex items-center justify-center h-full w-full rounded-full`}>
            {initials}
          </div>
        )}
        
        {status && (
          <div
            className={`
              absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-neutral-800
              ${size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-2.5 w-2.5' : 'h-3 w-3'}
              ${status === 'online' ? 'bg-success-500' : status === 'away' ? 'bg-warning-500' : 'bg-neutral-400'}
            `}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'
