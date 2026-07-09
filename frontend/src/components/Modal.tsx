import React from 'react'
import { X } from 'lucide-react'
import type { ModalProps } from '../types/index'

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      title,
      onClose,
      size = 'md',
      isDismissible = true,
      actions,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }
      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [isOpen])

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={isDismissible ? onClose : undefined}
        />

        {/* Modal */}
        <div
          ref={ref}
          className={`
            relative z-10 w-full rounded-lg bg-white dark:bg-neutral-800
            shadow-elevation-4 p-6
            ${sizeStyles[size]}
            ${className}
          `}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            {title && <h2 className="text-h3 font-semibold">{title}</h2>}
            {isDismissible && (
              <button
                onClick={onClose}
                className="ml-auto hover:opacity-70 transition-opacity p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="mb-6 max-h-96 overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {actions && (
            <div className="flex gap-3 justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'
