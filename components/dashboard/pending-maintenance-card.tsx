import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface MaintenanceRequest {
  id: string
  property: string
  tenant: string
  issue: string
  status: 'pending' | 'in_progress' | 'completed'
  submittedDate: string
}

interface PendingMaintenanceProps {
  requests: MaintenanceRequest[]
}

export function PendingMaintenanceCard({ requests }: PendingMaintenanceProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />
      case 'in_progress':
        return <AlertCircle className="w-3 h-3" />
      case 'completed':
        return <CheckCircle className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Pending Maintenance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No maintenance requests
            </p>
          ) : (
            requests.map((request) => (
              <div 
                key={request.id} 
                className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {request.property}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {request.tenant}
                    </p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={`${getStatusColor(request.status)} flex items-center gap-1 whitespace-nowrap`}
                  >
                    {getStatusIcon(request.status)}
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {request.issue}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
