import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Card } from './Card'

interface ChartContainerProps {
  title: string
  data: any[]
  type?: 'bar' | 'line' | 'pie'
  height?: number
  dataKey?: string
  children?: React.ReactNode
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  data,
  type = 'bar',
  height = 300,
  dataKey = 'value',
  children,
}) => {
  return (
    <Card header={<h3 className="text-h4 font-semibold">{title}</h3>}>
      {children || (
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' && (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Bar dataKey={dataKey} fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}

            {type === 'line' && (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke="#2563eb"
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}

            {type === 'pie' && (
              <PieChart>
                <Pie
                  data={data}
                  dataKey={dataKey}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
