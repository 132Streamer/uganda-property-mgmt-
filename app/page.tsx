import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">PropertyHub</div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/search">
              <Button>Browse Properties</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-foreground">
            Property Management Made Simple
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect landlords and tenants. Manage properties, payments, and maintenance requests all in one place.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline">Search Properties</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">For Landlords</h3>
              <p className="text-muted-foreground">Manage properties, tenants, payments, and maintenance requests effortlessly.</p>
            </div>
            <div className="bg-background rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">For Tenants</h3>
              <p className="text-muted-foreground">Find properties, submit maintenance requests, and manage your rental payments.</p>
            </div>
            <div className="bg-background rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">Communication Hub</h3>
              <p className="text-muted-foreground">Direct messaging and notifications keep everyone connected.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
