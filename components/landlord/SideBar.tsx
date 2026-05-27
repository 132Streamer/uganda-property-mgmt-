// components/landlord/Sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/landlord/dashboard', label: 'Dashboard' },
  { href: '/landlord/properties', label: 'Properties' },
  { href: '/landlord/tenants', label: 'Tenants' },
  { href: '/landlord/maintenance', label: 'Maintenance' },
  { href: '/landlord/payments', label: 'Payments' },
]

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 z-40 w-64 h-screen bg-card border-r border-border p-6 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <Link href="/landlord/dashboard" className="text-xl font-bold text-foreground mb-8">
          PropertyHub
        </Link>

        <nav className="space-y-2 flex-1">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  pathname === href
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {label}
              </Button>
            </Link>
          ))}
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
    </>
  )
}