'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'

interface LeaseDocumentProps {
  documentName?: string
  uploadDate?: string
  expiryDate?: string
  onDownload?: () => void
}

export function LeaseDocumentCard({
  documentName = 'Lease Agreement',
  uploadDate = '2024-01-15',
  expiryDate = '2025-01-14',
  onDownload
}: LeaseDocumentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Lease Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between p-3 bg-muted/50 rounded-lg border border-border">
            <div>
              <p className="font-semibold text-foreground">{documentName}</p>
              <p className="text-xs text-muted-foreground mt-1">Uploaded: {uploadDate}</p>
            </div>
            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          </div>

          <div className="grid grid-cols-2 gap-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Lease Start</p>
              <p className="font-semibold text-foreground text-sm">{uploadDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lease Expires</p>
              <p className="font-semibold text-foreground text-sm">{expiryDate}</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onDownload}
          variant="default"
          className="w-full flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Lease
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          PDF format • File size: 2.3 MB
        </p>
      </CardContent>
    </Card>
  )
}
