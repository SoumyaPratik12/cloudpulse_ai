import React from 'react'

interface DataTableProps {
  columns: Array<{
    key: string
    label: string
    width?: string
  }>
  rows: Array<Record<string, any>>
  loading?: boolean
  onRowClick?: (row: any) => void
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading = false,
  onRowClick,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-body-sm font-semibold text-neutral-700 dark:text-neutral-300 ${col.width || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-neutral-200 dark:border-neutral-700
                transition-smooth
                ${onRowClick ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/50' : ''}
              `}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-body-md text-neutral-900 dark:text-neutral-50 ${col.width || ''}`}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="flex items-center justify-center py-8 text-neutral-500">
          No data available
        </div>
      )}
    </div>
  )
}
