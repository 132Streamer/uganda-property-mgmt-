// app/landlord/layout.tsx
import { Sidebar } from '@/components/landlord/SideBar'

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:ml-64 p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  )
}