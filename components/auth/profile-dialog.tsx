'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { updateProfile } from '@/lib/actions/auth'

// ─── Types ────────────────────────────────────────────────────────────────

interface ProfileDialogProps {
  profile: {
    email: string
    full_name: string
    phone: string
  }
  /** Render as a sidebar menu-item row or a plain icon button */
  trigger?: React.ReactNode
}

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// ─── Helpers ─────────────────────────────────────────────────────────────

function getInitials(name: string, email: string): string {
  if (name.trim()) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

// ─── Component ───────────────────────────────────────────────────────────

export function ProfileDialog({ profile, trigger }: ProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile.full_name,
      phone: profile.phone,
    },
  })

  function onSubmit(values: ProfileFormValues) {
    startTransition(async () => {
      try {
        await updateProfile(values)
        toast.success('Profile updated')
        setIsEditing(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update profile')
      }
    })
  }

  const initials = getInitials(profile.full_name, profile.email)
  const displayName = profile.full_name || profile.email

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setIsEditing(false)
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          /* Default trigger: sidebar user row */
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="font-medium truncate max-w-[140px]">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {profile.email}
              </span>
            </div>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your account details.' : 'Your account information.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── View mode ──────────────────────────────────────────────── */}
        {!isEditing && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{displayName}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p>{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p>{profile.phone}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Edit mode ──────────────────────────────────────────────── */}
        {isEditing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+256 7XX XXX XXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email is read-only — managed by Supabase Auth */}
              <div>
                <p className="text-sm font-medium mb-1.5">Email</p>
                <Input value={profile.email} disabled className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
