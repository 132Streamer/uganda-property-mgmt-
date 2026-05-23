import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
  onClick?: () => void
}

export function StatCard({ 
  label, 
  value, 
  subtext, 
  icon, 
  trend, 
  trendValue,
  onClick 
}: StatCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon && <div className="text-primary">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {(subtext || trend) && (
            <div className="flex items-center gap-2">
              {subtext && (
                <p className="text-xs text-muted-foreground">{subtext}</p>
              )}
              {trend && trendValue && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {trendValue}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
