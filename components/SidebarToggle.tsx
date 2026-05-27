// components/landlord/SidebarToggle.tsx
'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SidebarToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <aside className={`fixed left-0 top-0 w-64 h-screen ... transition-transform
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {children}
      </aside>
    </>
  )
}