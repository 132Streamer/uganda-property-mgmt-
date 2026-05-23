'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface IncomeChartProps {
  data: Array<{
    month: string
    income: number
  }>
  currency?: string
}

export function IncomeChartCard({ data, currency = 'UGX' }: IncomeChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    return `${(value / 1000).toFixed(0)}K`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Income Trend (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--muted-foreground)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                tickFormatter={formatCurrency}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Bar 
                dataKey="income" 
                fill="var(--primary)" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
