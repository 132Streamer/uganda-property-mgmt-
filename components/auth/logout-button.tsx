'use client'

import { useTransition } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { signOut } from '@/lib/actions/auth'

interface LogoutButtonProps {
  /** Render as a full menu item row (default) or an icon-only button */
  variant?: 'menu-item' | 'icon'
}

export function LogoutButton({ variant = 'menu-item' }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await signOut()
    })
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
        title="Sign out"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        <LogOut className="h-4 w-4 shrink-0" />
      )}
      Sign out
    </button>
  )
}
