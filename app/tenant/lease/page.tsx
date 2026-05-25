'use client'

export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface LeaseDocument {
  id: string
  file_name: string
  file_size: number
  created_at: string
  storage_path: string
}

const BUCKET = 'lease-docs'
const SIGNED_URL_EXPIRY = 3600 // 1 hour

export default function TenantLeasePage() {
  const supabase = createClientComponentlient()
  const [documents, setDocuments] = useState<LeaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    loadLeases()
  }, [])

  async function loadLeases() {
    setLoading(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    // Get tenant's active tenancy
    const { data: tenancy, error: tenancyError } = await supabase
      .from('tenancies')
      .select('id')
      .eq('tenant_id', session.user.id)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (tenancyError || !tenancy) {
      setError('No active tenancy found')
      setLoading(false)
      return
    }

    const res = await fetch(`/api/lease?tenancy_id=${tenancy.id}`)
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to load documents')
    } else {
      setDocuments(json.data)
    }

    setLoading(false)
  }

  async function handleDownload(doc: LeaseDocument) {
    setDownloadingId(doc.id)

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY)

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error)
      setDownloadingId(null)
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    setDownloadingId(null)
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Lease Documents</h1>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No lease documents uploaded yet.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploaded {format(new Date(doc.created_at), 'dd MMM yyyy, HH:mm')} ·{' '}
                    {formatBytes(doc.file_size)}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={downloadingId === doc.id}
                  onClick={() => handleDownload(doc)}
                  className="shrink-0"
                >
                  {downloadingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Download links expire after 1 hour. Refresh page to regenerate.
      </p>
    </div>
  )
}
