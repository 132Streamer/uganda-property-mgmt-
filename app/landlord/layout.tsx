import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export const metadata: Metadata = {
  title: 'Landlord - PropertyHub',
  description: 'Manage your properties and tenants',
}

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex">
  {/* Overlay for mobile */}
  {isOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-20 lg:hidden"
      onClick={() => setIsOpen(false)}
    />
  )}  
     {/* Sidebar */}
  <aside className={`
    fixed left-0 top-0 h-screen w-64 z-30 bg-white transition-transform duration-300
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
  `}>
    <Link href="/landlord/dashboard" className="text-xl font-bold text-foreground mb-8">
          PropertyHub
        </Link>
        <nav className="space-y-2 flex-1">
          <Link href="/landlord/dashboard">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Dashboard
            </Button>
          </Link>
          <Link href="/landlord/properties">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Properties
            </Button>
          </Link>
          <Link href="/landlord/tenants">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Tenants
            </Button>
          </Link>
          <Link href="/landlord/maintenance">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Maintenance
            </Button>
          </Link>
          <Link href="/landlord/payments">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              Payments
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
      <main className="flex-1 lg:ml-64">
    {/* Mobile top bar */}
    <div className="lg:hidden flex items-center p-4 border-b">
      <button onClick={() => setIsOpen(true)}>
        <Menu className="h-6 w-6" />
      </button>
      <h1 className="ml-4 font-semibold">PropertyHub</h1>
    </div>
    {children}
  </main>
    </div>
  )
}
