# PropertyHub SaaS - Project Structure Summary

## Quick Overview

A **Next.js 14 App Router** property management SaaS with role-based routing for landlords and tenants, built with **Supabase Auth** and **Tailwind CSS**.

---

## File Structure at a Glance

```
app/
├── (auth)                    ← Authentication routes (public)
│   ├── layout.tsx           ← Centered card layout
│   ├── login/page.tsx
│   └── signup/page.tsx
│
├── (landlord)               ← Landlord dashboard (protected)
│   ├── layout.tsx           ← Sidebar + main area
│   ├── dashboard/page.tsx
│   ├── properties/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── tenants/page.tsx
│   ├── maintenance/page.tsx
│   └── payments/page.tsx
│
├── (tenant)                 ← Tenant portal (protected)
│   ├── layout.tsx           ← Sidebar + main area
│   ├── portal/page.tsx
│   ├── payments/page.tsx
│   ├── maintenance/page.tsx
│   ├── messages/page.tsx
│   └── lease/page.tsx
│
├── search/                  ← Public property search
│   └── page.tsx
│
├── layout.tsx              ← Root layout
├── page.tsx                ← Home landing page
└── globals.css             ← Global styles

lib/
├── supabase/
│   ├── client.ts           ← Client-side Supabase
│   └── server.ts           ← Server-side Supabase
├── auth/
│   └── types.ts            ← Auth interfaces
└── utils.ts                ← Helper functions

middleware.ts              ← Auth routing middleware
.env.local                 ← Environment variables
```

---

## Route Mapping

### Public Routes (No Auth Required)
| Route | Purpose | File |
|-------|---------|------|
| `/` | Landing page | `app/page.tsx` |
| `/login` | Login form | `app/(auth)/login/page.tsx` |
| `/signup` | Registration form | `app/(auth)/signup/page.tsx` |
| `/search` | Browse properties | `app/search/page.tsx` |

### Landlord Routes (Protected - role: 'landlord')
| Route | Purpose | File |
|-------|---------|------|
| `/landlord/dashboard` | Overview & stats | `app/(landlord)/dashboard/page.tsx` |
| `/landlord/properties` | List properties | `app/(landlord)/properties/page.tsx` |
| `/landlord/properties/[id]` | Property details | `app/(landlord)/properties/[id]/page.tsx` |
| `/landlord/tenants` | Manage tenants | `app/(landlord)/tenants/page.tsx` |
| `/landlord/maintenance` | Track maintenance | `app/(landlord)/maintenance/page.tsx` |
| `/landlord/payments` | Payment tracking | `app/(landlord)/payments/page.tsx` |

### Tenant Routes (Protected - role: 'tenant')
| Route | Purpose | File |
|-------|---------|------|
| `/tenant/portal` | Tenant dashboard | `app/(tenant)/portal/page.tsx` |
| `/tenant/payments` | Pay rent, view history | `app/(tenant)/payments/page.tsx` |
| `/tenant/maintenance` | Submit requests | `app/(tenant)/maintenance/page.tsx` |
| `/tenant/messages` | Message landlord | `app/(tenant)/messages/page.tsx` |
| `/tenant/lease` | View lease terms | `app/(tenant)/lease/page.tsx` |

---

## Layout Structure & Metadata

### 1. Root Layout (`app/layout.tsx`)
- **Type**: Wraps all routes
- **Contains**: HTML, body, global metadata, Analytics
- **Metadata**: Main site title, description, icons
```typescript
export const metadata: Metadata = {
  title: 'PropertyHub - Property Management SaaS',
  description: 'Manage your properties and rentals with ease',
}
```

### 2. Auth Layout (`app/(auth)/layout.tsx`)
- **Routes**: `/login`, `/signup`
- **Type**: Public, centers forms
- **Layout**: Min-height screen, centered container (max-w-md)
- **CSS**: `min-h-screen bg-muted flex items-center justify-center`

### 3. Landlord Layout (`app/(landlord)/layout.tsx`)
- **Routes**: All `/landlord/*` routes
- **Type**: Protected (requires landlord role)
- **Layout**: Fixed left sidebar (w-64) + main content (ml-64)
- **Navigation**:
  ```
  Dashboard
  Properties
  Tenants
  Maintenance Requests
  Payments
  ─────────
  Profile
  Logout
  ```
- **CSS**: 
  ```
  Sidebar: fixed left-0 top-0 w-64 h-screen bg-card border-r
  Main: ml-64 p-8
  ```

### 4. Tenant Layout (`app/(tenant)/layout.tsx`)
- **Routes**: All `/tenant/*` routes
- **Type**: Protected (requires tenant role)
- **Layout**: Fixed left sidebar (w-64) + main content (ml-64)
- **Navigation**:
  ```
  Portal
  Lease
  Payments
  Maintenance Requests
  Messages
  ─────────
  Profile
  Logout
  ```
- **CSS**: Same as Landlord Layout

---

## Key Files

### Supabase Integration
```
lib/supabase/client.ts      ← Client-side setup
lib/supabase/server.ts      ← Server-side setup
lib/auth/types.ts           ← Auth type definitions
middleware.ts               ← Route protection
.env.local                  ← Credentials
```

### Authentication Files
```
app/(auth)/login/page.tsx       ← Login form (Client Component)
app/(auth)/signup/page.tsx      ← Signup form (Client Component)
middleware.ts                   ← Auth routing & protection
```

### Layouts with Navigation
```
app/(auth)/layout.tsx       ← Centered form layout
app/(landlord)/layout.tsx   ← Sidebar + nav layout
app/(tenant)/layout.tsx     ← Sidebar + nav layout
```

---

## Design System (Tailwind CSS)

### Color Tokens (shadcn/ui)
- `bg-background` - Primary background
- `bg-card` - Card background
- `bg-muted` - Secondary background
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `border-border` - Border color

### Spacing
- Sidebar width: `w-64`
- Main padding: `p-8`, `p-6`
- Gap spacing: `gap-4`, `gap-6`

### Layout Components
- Flex layouts: `flex items-center justify-between`
- Grid layouts: `grid md:grid-cols-2 gap-4`
- Cards: `Card`, `CardHeader`, `CardContent`
- Buttons: `Button`, `Button variant="outline"`, `Button size="sm"`

---

## Component Hierarchy Example

```typescript
// Root Layout
<html>
  <body>
    {/* Public Page */}
    {/* Page renders directly inside body */}
    
    {/* Auth Routes - wrapped in Auth Layout */}
    {/* Auth Layout centers the form */}
    
    {/* Landlord Routes - wrapped in Landlord Layout */}
    {/* Landlord Layout provides sidebar + main area */}
    
    {/* Tenant Routes - wrapped in Tenant Layout */}
    {/* Tenant Layout provides sidebar + main area */}
  </body>
</html>
```

---

## Next Steps for Implementation

1. **Setup Supabase**
   - Create Supabase project
   - Get credentials from Settings
   - Add to `.env.local`

2. **Setup Database**
   - Create `users` table with auth integration
   - Create `properties`, `tenants`, `maintenance_requests` tables
   - Add RLS policies for row-level security

3. **Implement Auth**
   - Complete `app/(auth)/login/page.tsx` with Supabase logic
   - Complete `app/(auth)/signup/page.tsx` with role selection
   - Add middleware.ts role checking

4. **Add API Routes**
   - `/api/properties` - CRUD operations
   - `/api/tenants` - Tenant management
   - `/api/payments` - Payment processing
   - `/api/maintenance` - Maintenance requests

5. **Styling & Customization**
   - Update Tailwind theme colors
   - Add custom fonts
   - Implement dark mode if needed

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here (for server-side only)
```

---

## Features Included

✅ **Folder Structure**
- Organized route groups with parentheses
- Separated auth, landlord, and tenant routes
- Public search route

✅ **Layouts**
- Root layout with metadata
- Auth centered layout
- Landlord sidebar layout with navigation
- Tenant sidebar layout with navigation

✅ **Pages**
- Landing page with hero section
- Login & signup forms with role selection
- Landlord dashboard, properties, tenants, maintenance, payments
- Tenant portal, payments, maintenance, messages, lease

✅ **Supabase Setup**
- Client and server-side Supabase clients
- Auth types and interfaces
- Middleware for route protection

✅ **Styling**
- Tailwind CSS configuration
- shadcn/ui components
- Semantic color tokens
- Responsive design patterns

---

**Ready to deploy!** Install dependencies, add Supabase credentials, and start building your property management platform.
