'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Wrench } from 'lucide-react'

interface MaintenanceFormProps {
  propertyAddress?: string
  onSubmit?: (data: { issue: string; priority: string }) => void
}

export function MaintenanceRequestForm({ propertyAddress, onSubmit }: MaintenanceFormProps) {
  const [issue, setIssue] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (issue.trim()) {
      onSubmit?.({ issue, priority })
      setSubmitted(true)
      setIssue('')
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          Submit Maintenance Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {propertyAddress && (
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">Property</p>
            <p className="font-semibold text-foreground">{propertyAddress}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Describe the Issue
          </label>
          <Textarea
            placeholder="Describe the maintenance issue or repair needed..."
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="min-h-24"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Priority Level
          </label>
          <div className="flex gap-2">
            {['low', 'normal', 'urgent'].map((level) => (
              <button
                key={level}
                onClick={() => setPriority(level)}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors capitalize text-sm font-medium ${
                  priority === level
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {submitted && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800">Request submitted successfully!</p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!issue.trim()}
          className="w-full"
        >
          Submit Request
        </Button>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Urgent requests will be prioritized. Emergency issues can be reported by calling your landlord directly.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
