'use client'

import { useEffect, useRef, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'

interface Tenancy {
  id: string
  tenant_name: string
  start_date: string
  end_date: string | null
}

interface LeaseDocument {
  id: string
  file_name: string
  file_size: number
  created_at: string
  storage_path: string
}

interface TenancyWithLeases extends Tenancy {
  leases: LeaseDocument[]
  uploading: boolean
  error: string | null
}

interface Props {
  params: { id: string }
}

export default function PropertyPage({ params }: Props) {
  const supabase = createClientComponentClient()
  const [tenancies, setTenancies] = useState<TenancyWithLeases[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetchTenancies()
  }, [params.id])

  async function fetchTenancies() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tenancies')
      .select(`
        id,
        tenant_name,
        start_date,
        end_date,
        lease_documents (
          id,
          file_name,
          file_size,
          created_at,
          storage_path
        )
      `)
      .eq('property_id', params.id)
      .order('start_date', { ascending: false })

    if (!error && data) {
      setTenancies(
        data.map((t: any) => ({
          ...t,
          leases: t.lease_documents ?? [],
          uploading: false,
          error: null,
        }))
      )
    }
    setLoading(false)
  }

  function setTenancyState(tenancyId: string, patch: Partial<TenancyWithLeases>) {
    setTenancies((prev) =>
      prev.map((t) => (t.id === tenancyId ? { ...t, ...patch } : t))
    )
  }

  async function handleFileChange(tenancyId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''

    if (file.type !== 'application/pdf') {
      setTenancyState(tenancyId, { error: 'PDF files only' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setTenancyState(tenancyId, { error: 'File exceeds 10MB limit' })
      return
    }

    setTenancyState(tenancyId, { uploading: true, error: null })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('tenancy_id', tenancyId)

    const res = await fetch('/api/lease', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      setTenancyState(tenancyId, { uploading: false, error: json.error ?? 'Upload failed' })
      return
    }

    setTenancies((prev) =>
      prev.map((t) =>
        t.id === tenancyId
          ? {
              ...t,
              uploading: false,
              leases: [
                {
                  id: json.data.id,
                  file_name: json.data.file_name,
                  file_size: json.data.file_size,
                  created_at: json.data.created_at,
                  storage_path: json.data.storage_path,
                },
                ...t.leases,
              ],
            }
          : t
      )
    )
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold">Property Leases</h1>

      {tenancies.length === 0 && (
        <p className="text-muted-foreground text-sm">No tenancies found for this property.</p>
      )}

      {tenancies.map((tenancy) => (
        <Card key={tenancy.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">{tenancy.tenant_name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {tenancy.end_date ? 'Past' : 'Active'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(tenancy.start_date), 'dd MMM yyyy')}
              {tenancy.end_date && ` – ${format(new Date(tenancy.end_date), 'dd MMM yyyy')}`}
            </p>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <input
                ref={(el) => { fileInputRefs.current[tenancy.id] = el }}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(tenancy.id, e)}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={tenancy.uploading}
                onClick={() => fileInputRefs.current[tenancy.id]?.click()}
              >
                {tenancy.uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Lease PDF
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">PDF · max 10MB</span>
            </div>

            {tenancy.error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{tenancy.error}</AlertDescription>
              </Alert>
            )}

            {tenancy.leases.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Uploaded Documents
                </p>
                {tenancy.leases.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(doc.created_at), 'dd MMM yyyy, HH:mm')} ·{' '}
                        {formatBytes(doc.file_size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}