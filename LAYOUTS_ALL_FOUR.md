# PropertyHub - All Layout.tsx Files Reference

## Overview of All 4 Layout Files

There are exactly **4 layout.tsx files** in this project:

1. **Root Layout** - `app/layout.tsx`
2. **Auth Layout** - `app/(auth)/layout.tsx`
3. **Landlord Layout** - `app/(landlord)/layout.tsx`
4. **Tenant Layout** - `app/(tenant)/layout.tsx`

---

## 1️⃣ ROOT LAYOUT: `app/layout.tsx`

**Scope:** Wraps entire application
**Applied to:** Every single route
**Location:** app/layout.tsx

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'PropertyHub - Property Management SaaS',
  description: 'Manage your properties and rentals with ease',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
```

**Key Features:**
- Sets `<html>` and `<body>` tags
- Global metadata for SEO
- Font setup (Geist Sans & Mono)
- Analytics integration for production
- `globals.css` imported (Tailwind styles)

---

## 2️⃣ AUTH LAYOUT: `app/(auth)/layout.tsx`

**Scope:** /login, /signup
**Purpose:** Centered card container for auth forms
**Location:** app/(auth)/layout.tsx

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - PropertyHub',
  description: 'Login or sign up for PropertyHub',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

**Structure:**
```
Outer Div (min-h-screen, centered)
  └── Inner Div (max-w-md, responsive)
      └── {children} (Login/Signup form)
```

**CSS Classes:**
- `min-h-screen` - Full height
- `bg-muted` - Secondary background color
- `flex items-center justify-center` - Center content
- `p-4` - Responsive padding
- `w-full max-w-md` - Full width up to 448px

**Applied Routes:**
- `/login` → renders LoginPage inside centered container
- `/signup` → renders SignupPage inside centered container

---

## 3️⃣ LANDLORD LAYOUT: `app/(landlord)/layout.tsx`

**Scope:** /landlord/* (all landlord routes)
**Purpose:** Fixed sidebar + main content area
**Location:** app/(landlord)/layout.tsx

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Landlord - PropertyHub',
  description: 'Manage your properties and tenants',
}

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border p-6 flex flex-col">
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
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
```

**Structure:**
```
Outer Div (min-h-screen, bg-background)
  ├── Sidebar (fixed left-0 top-0 w-64 h-screen)
  │   ├── Logo (links to /landlord/dashboard)
  │   ├── Nav (5 items)
  │   │   ├── Dashboard → /landlord/dashboard
  │   │   ├── Properties → /landlord/properties
  │   │   ├── Tenants → /landlord/tenants
  │   │   ├── Maintenance → /landlord/maintenance
  │   │   └── Payments → /landlord/payments
  │   └── Footer (Profile + Logout)
  └── Main (ml-64 p-8)
      └── {children} (Dashboard/Properties/etc.)
```

**Key Measurements:**
- Sidebar width: `w-64` (256px)
- Main margin-left: `ml-64` (accounts for sidebar)
- Main padding: `p-8` (2rem)

**Applied Routes:**
- `/landlord/dashboard` → Dashboard page in main area
- `/landlord/properties` → Properties list in main area
- `/landlord/properties/[id]` → Property details in main area
- `/landlord/tenants` → Tenants page in main area
- `/landlord/maintenance` → Maintenance page in main area
- `/landlord/payments` → Payments page in main area

---

## 4️⃣ TENANT LAYOUT: `app/(tenant)/layout.tsx`

**Scope:** /tenant/* (all tenant routes)
**Purpose:** Fixed sidebar + main content area
**Location:** app/(tenant)/layout.tsx

```typescript
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
```

**Structure:**
```
Outer Div (min-h-screen, bg-background)
  ├── Sidebar (fixed left-0 top-0 w-64 h-screen)
  │   ├── Logo (links to /tenant/portal)
  │   ├── Nav (5 items)
  │   │   ├── Portal → /tenant/portal
  │   │   ├── Lease → /tenant/lease
  │   │   ├── Payments → /tenant/payments
  │   │   ├── Maintenance Requests → /tenant/maintenance
  │   │   └── Messages → /tenant/messages
  │   └── Footer (Profile + Logout)
  └── Main (ml-64 p-8)
      └── {children} (Portal/Payments/etc.)
```

**Key Measurements:**
- Sidebar width: `w-64` (256px)
- Main margin-left: `ml-64` (accounts for sidebar)
- Main padding: `p-8` (2rem)

**Applied Routes:**
- `/tenant/portal` → Portal page in main area
- `/tenant/lease` → Lease page in main area
- `/tenant/payments` → Payments page in main area
- `/tenant/maintenance` → Maintenance page in main area
- `/tenant/messages` → Messages page in main area

---

## Layout Hierarchy Diagram

```
Root Layout (app/layout.tsx)
├─ Public Pages
│  ├─ / (app/page.tsx)
│  └─ /search (app/search/page.tsx)
│
├─ Auth Layout (app/(auth)/layout.tsx)
│  ├─ /login (app/(auth)/login/page.tsx)
│  └─ /signup (app/(auth)/signup/page.tsx)
│
├─ Landlord Layout (app/(landlord)/layout.tsx)
│  ├─ /landlord/dashboard
│  ├─ /landlord/properties
│  ├─ /landlord/properties/[id]
│  ├─ /landlord/tenants
│  ├─ /landlord/maintenance
│  └─ /landlord/payments
│
└─ Tenant Layout (app/(tenant)/layout.tsx)
   ├─ /tenant/portal
   ├─ /tenant/lease
   ├─ /tenant/payments
   ├─ /tenant/maintenance
   └─ /tenant/messages
```

---

## Comparison Table

| Aspect | Root | Auth | Landlord | Tenant |
|--------|------|------|----------|--------|
| **File** | app/layout.tsx | app/(auth)/layout.tsx | app/(landlord)/layout.tsx | app/(tenant)/layout.tsx |
| **Scope** | All routes | /login, /signup | /landlord/* | /tenant/* |
| **Structure** | HTML wrapper | Centered form | Sidebar layout | Sidebar layout |
| **Sidebar** | None | None | Yes (w-64) | Yes (w-64) |
| **Navigation** | None | None | 5 items | 5 items |
| **Main Area** | Direct | Centered container | ml-64 | ml-64 |
| **Background** | (via globals.css) | bg-muted | bg-background | bg-background |

---

## Key Takeaways

✅ **Root Layout** - Provides HTML structure and global metadata
✅ **Auth Layout** - Centers forms for login/signup
✅ **Landlord Layout** - Provides persistent sidebar for landlord routes
✅ **Tenant Layout** - Provides persistent sidebar for tenant routes

Each layout wraps its child pages and provides consistent UI structure.

---

## Quick Reference: CSS Classes Used

### Sizing & Positioning
- `fixed left-0 top-0` - Fixed position
- `w-64` - Width (256px)
- `h-screen` - Full height
- `ml-64` - Margin left (256px)
- `min-h-screen` - Minimum full height
- `max-w-md` - Max width (448px)

### Flexbox
- `flex` - Flexbox display
- `flex-col` - Column direction
- `flex-1` - Flex grow
- `items-center` - Center vertically
- `justify-center` - Center horizontally
- `justify-start` - Align left

### Spacing
- `p-4` - Padding (1rem)
- `p-6` - Padding (1.5rem)
- `p-8` - Padding (2rem)
- `pt-4` - Padding top
- `mb-8` - Margin bottom
- `space-y-2` - Vertical gap (0.5rem)

### Colors
- `bg-background` - Primary background
- `bg-card` - Card background
- `bg-muted` - Secondary background
- `text-foreground` - Primary text
- `border-border` - Border color
- `border-r` - Right border
- `border-t` - Top border

---

This is your complete layout.tsx reference guide!
