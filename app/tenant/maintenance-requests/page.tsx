'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { FileUploader } from '@/components/file-uploader'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, PlusCircle, Wrench } from 'lucide-react'

type Priority = 'low' | 'medium' | 'high' | 'emergency'
type Status = 'open' | 'in_progress' | 'resolved'

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  images: string[]
  created_at: string
  updated_at: string
}

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  priority: z.enum(['low', 'medium', 'high', 'emergency']),
})

type FormValues = z.infer<typeof formSchema>

const priorityConfig: Record<Priority, { label: string; variant: 'outline' | 'secondary' | 'destructive' | 'default' }> = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'secondary' },
  high: { label: 'High', variant: 'default' },
  emergency: { label: 'Emergency', variant: 'destructive' },
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800 border-green-200' },
}

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
  })

  async function fetchRequests() {
    try {
      const res = await fetch('/api/maintenance')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setRequests(json.data)
    } catch (err) {
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, images: uploadedImages }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast.success('Request submitted')
      form.reset()
      setUploadedImages([])
      setShowForm(false)
      fetchRequests()
    } catch (err: any) {
      toast.error(err.message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
            <p className="text-sm text-muted-foreground">Submit and track repair requests</p>
          </div>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'outline' : 'default'}>
          <PlusCircle className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'New Request'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>Describe the issue and we'll get it sorted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Leaking kitchen tap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the issue in detail..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low — Not urgent</SelectItem>
                          <SelectItem value="medium">Medium — Needs attention</SelectItem>
                          <SelectItem value="high">High — Affects daily use</SelectItem>
                          <SelectItem value="emergency">Emergency — Safety risk</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Photos (optional)</FormLabel>
                  <FileUploader
                    accept={{ 'image/*': [] }}
                    maxFiles={5}
                    maxSize={5 * 1024 * 1024}
                    onUploadComplete={(urls: string[]) => setUploadedImages(urls)}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Request list */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your Requests</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No requests yet. Submit one above.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-medium truncate">{req.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={priorityConfig[req.priority].variant}>
                        {priorityConfig[req.priority].label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={statusConfig[req.status].className}
                      >
                        {statusConfig[req.status].label}
                      </Badge>
                    </div>
                  </div>
                  {req.images.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {req.images.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={url}
                          alt={`Attachment ${i + 1}`}
                          className="h-16 w-16 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}