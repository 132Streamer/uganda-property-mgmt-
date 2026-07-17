// app/tenant/layout.tsx
import { SidebarUserFooter } from '@/components/auth/sidebar-user-footer'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SidebarUserFooter />
      <main className="md:ml-64 p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}
