import React from 'react'
import type { CardProps } from '../types/index'

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      header,
      footer,
      hoverable = false,
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
          rounded-md bg-white dark:bg-neutral-800
          border border-neutral-200 dark:border-neutral-700
          shadow-elevation-2
          overflow-hidden
          transition-smooth
          ${hoverable ? 'hover:shadow-elevation-3 cursor-pointer' : ''}
          ${className}
        `}
        {...props}
      >
        {header && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            {header}
          </div>
        )}
        
        <div className="px-6 py-4">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
            {footer}
          </div>
        )}
      </div>
    )
  }
)

Card.displayName = 'Card'
