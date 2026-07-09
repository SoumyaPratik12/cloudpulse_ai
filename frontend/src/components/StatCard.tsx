import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  backgroundColor?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  backgroundColor = 'bg-primary-50 dark:bg-primary-900/20',
}) => {
  const isPositiveTrend = trend ? trend > 0 : false

  return (
    <div className="rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 shadow-elevation-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body-md text-neutral-500 dark:text-neutral-400 mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-h2 font-bold text-neutral-900 dark:text-white">{value}</p>
            {unit && <span className="text-body-md text-neutral-500 dark:text-neutral-400">{unit}</span>}
          </div>

          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-body-sm font-semibold ${isPositiveTrend ? 'text-success-600' : 'text-error-600'}`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trend)}% {trendLabel || 'change'}
            </div>
          )}
        </div>

        {icon && (
          <div className={`h-12 w-12 rounded-md ${backgroundColor} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
