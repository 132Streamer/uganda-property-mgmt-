# PropertyHub SaaS - Layout Files Deep Dive

## All Layout Files Summary

### 1. Root Layout: `app/layout.tsx`

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
    icon: [...],
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

**Purpose**: Wraps entire application, sets global metadata and styles
**Contains**: HTML structure, body wrapper, Analytics
**Applies to**: All routes in the app

---

### 2. Auth Layout: `app/(auth)/layout.tsx`

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

**Purpose**: Provide centered layout for login and signup forms
**Contains**: Flexbox centering, 400px max-width container
**Applied Routes**: `/login`, `/signup`
**Key Features**:
- Min-height full screen (`min-h-screen`)
- Centered flex layout (`flex items-center justify-center`)
- Muted background (`bg-muted`)
- Max width for forms (`max-w-md`)
- Responsive padding (`p-4`)

---

### 3. Landlord Layout: `app/(landlord)/layout.tsx`

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
            <Button variant="ghost" className="w-full justify-start">
              Dashboard
            </Button>
          </Link>
          <Link href="/landlord/properties">
            <Button variant="ghost" className="w-full justify-start">
              Properties
            </Button>
          </Link>
          <Link href="/landlord/tenants">
            <Button variant="ghost" className="w-full justify-start">
              Tenants
            </Button>
          </Link>
          <Link href="/landlord/maintenance">
            <Button variant="ghost" className="w-full justify-start">
              Maintenance
            </Button>
          </Link>
          <Link href="/landlord/payments">
            <Button variant="ghost" className="w-full justify-start">
              Payments
            </Button>
          </Link>
        </nav>
        <div className="space-y-2 border-t border-border pt-4">
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start">
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

**Purpose**: Provide persistent sidebar navigation for all landlord routes
**Contains**: 
- Fixed left sidebar (w-64)
- Navigation menu with 5 main sections
- Profile and Logout buttons
- Main content area with ml-64 margin

**Applied Routes**: `/landlord/*` (all landlord routes)

**Key Features**:
- **Sidebar**: `fixed left-0 top-0 w-64 h-screen`
- **Navigation**: `flex flex-col` with `space-y-2` gaps
- **Main Area**: `ml-64 p-8`
- **Styling**: Uses design tokens (bg-card, border-border, etc.)

**Navigation Links**:
1. Dashboard → `/landlord/dashboard`
2. Properties → `/landlord/properties`
3. Tenants → `/landlord/tenants`
4. Maintenance → `/landlord/maintenance`
5. Payments → `/landlord/payments`
6. Profile → `/profile`
7. Logout → (action button)

---

### 4. Tenant Layout: `app/(tenant)/layout.tsx`

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
            <Button variant="ghost" className="w-full justify-start">
              Portal
            </Button>
          </Link>
          <Link href="/tenant/lease">
            <Button variant="ghost" className="w-full justify-start">
              Lease
            </Button>
          </Link>
          <Link href="/tenant/payments">
            <Button variant="ghost" className="w-full justify-start">
              Payments
            </Button>
          </Link>
          <Link href="/tenant/maintenance">
            <Button variant="ghost" className="w-full justify-start">
              Maintenance Requests
            </Button>
          </Link>
          <Link href="/tenant/messages">
            <Button variant="ghost" className="w-full justify-start">
              Messages
            </Button>
          </Link>
        </nav>
        <div className="space-y-2 border-t border-border pt-4">
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start">
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

**Purpose**: Provide persistent sidebar navigation for all tenant routes
**Contains**: 
- Fixed left sidebar (w-64)
- Navigation menu with 5 main sections
- Profile and Logout buttons
- Main content area with ml-64 margin

**Applied Routes**: `/tenant/*` (all tenant routes)

**Key Features**:
- **Sidebar**: `fixed left-0 top-0 w-64 h-screen`
- **Navigation**: `flex flex-col` with `space-y-2` gaps
- **Main Area**: `ml-64 p-8`
- **Styling**: Uses design tokens (bg-card, border-border, etc.)

**Navigation Links**:
1. Portal → `/tenant/portal`
2. Lease → `/tenant/lease`
3. Payments → `/tenant/payments`
4. Maintenance Requests → `/tenant/maintenance`
5. Messages → `/tenant/messages`
6. Profile → `/profile`
7. Logout → (action button)

---

## Layout Nesting Visualization

```
Root Layout (app/layout.tsx)
│
├─ Public Routes (use root layout directly)
│  ├─ / (home)
│  └─ /search (property search)
│
├─ Auth Layout (app/(auth)/layout.tsx)
│  ├─ /login
│  └─ /signup
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
   ├─ /tenant/payments
   ├─ /tenant/maintenance
   ├─ /tenant/messages
   └─ /tenant/lease
```

---

## Tailwind CSS Classes Used

### Sizing
- `w-64` - Sidebar width (256px)
- `h-screen` - Full height
- `p-4` - Padding (1rem)
- `p-6` - Padding (1.5rem)
- `p-8` - Padding (2rem)
- `ml-64` - Margin left (256px)
- `min-h-screen` - Minimum full height

### Layout
- `fixed` - Fixed positioning
- `flex` - Flexbox display
- `flex-col` - Column direction
- `items-center` - Vertical center
- `justify-start` - Left alignment
- `justify-center` - Center alignment
- `space-y-2` - Vertical gap (0.5rem)
- `space-y-4` - Vertical gap (1rem)
- `left-0` - Left position 0
- `top-0` - Top position 0

### Colors
- `bg-background` - Primary background
- `bg-card` - Card background
- `bg-muted` - Muted/secondary background
- `text-foreground` - Primary text
- `border-border` - Border color
- `border-r` - Right border
- `border-t` - Top border

### Other
- `w-full` - Full width
- `max-w-md` - Max width 448px

---

## Key Differences Between Layouts

| Aspect | Auth Layout | Landlord Layout | Tenant Layout |
|--------|------------|-----------------|---------------|
| **Purpose** | Form centering | Navigation hub | Navigation hub |
| **Sidebar** | None | Fixed left | Fixed left |
| **Logo Link** | N/A | Dashboard | Portal |
| **Navigation Items** | 5 items | 5 items | 5 items |
| **Main Area** | Centered container | ml-64 | ml-64 |
| **Background** | muted | background | background |
| **Routes** | /login, /signup | /landlord/* | /tenant/* |

---

## CSS Grid Structure Examples

### Auth Layout (Centered)
```
┌────────────────────────────────┐
│                                │
│      ┌─────────────────┐       │
│      │   Login Form    │       │
│      │  (max-w-md)     │       │
│      └─────────────────┘       │
│                                │
└────────────────────────────────┘
```

### Landlord/Tenant Layouts (Sidebar)
```
┌────────────┬──────────────────────────┐
│            │                          │
│ Sidebar    │    Main Content          │
│ (w-64)     │    (ml-64, p-8)          │
│            │                          │
│ - Logo     │    Dashboard Content     │
│ - Nav 1    │    Properties Content    │
│ - Nav 2    │    Tenants Content       │
│ - Nav 3    │    etc.                  │
│ - Nav 4    │                          │
│ - Nav 5    │                          │
│ ─────────  │                          │
│ - Profile  │                          │
│ - Logout   │                          │
│            │                          │
└────────────┴──────────────────────────┘
```

---

## Implementation Notes

1. **Metadata Inheritance**: Child layouts can override parent metadata
2. **Navigation**: All sidebar links use `Link` component for client-side routing
3. **Button Styling**: Navigation buttons use `variant="ghost"` for subtle styling
4. **Responsive**: Use `w-full` on buttons to stretch across sidebar
5. **Spacing**: Use `space-y-*` classes between navigation items
6. **Colors**: All use design tokens (background, foreground, etc.)
7. **Fixed Sidebar**: Sidebar is `fixed` so it stays visible when scrolling content
8. **Main Margin**: Content area has `ml-64` to account for fixed sidebar width

---

This structure provides a scalable, maintainable layout system that clearly separates concerns and provides consistent navigation across role-based sections of the application.
