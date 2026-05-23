import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Tenant Portal - PropertyHub',
  description: 'Manage your rental',
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border p-6 flex flex-col">
        <Link href="/tenant/portal" className="text-xl font-bold text-foreground mb-8">
          PropertyHub
        </Link>
        <nav className="space-y-2 flex-1">
          <Link href="/tenant/portal">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Portal
            </Button>
          </Link>
          <Link href="/tenant/lease">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Lease
            </Button>
          </Link>
          <Link href="/tenant/payments">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Payments
            </Button>
          </Link>
          <Link href="/tenant/maintenance">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Maintenance Requests
            </Button>
          </Link>
          <Link href="/tenant/messages">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Messages
            </Button>
          </Link>
        </nav>
        <div className="space-y-2 border-t border-border pt-4">
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Profile
            </Button>
          </Link>
          <Button variant="outline" className="w-full justify-start">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
