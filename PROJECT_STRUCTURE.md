# PropertyHub - Next.js 14 SaaS Project Structure

## Complete Folder Structure

```
project-root/
├── app/
│   ├── (auth)/                          # Authentication routes (public)
│   │   ├── layout.tsx                   # Auth layout wrapper
│   │   ├── login/
│   │   │   └── page.tsx                 # Login page
│   │   └── signup/
│   │       └── page.tsx                 # Sign up page
│   │
│   ├── (landlord)/                      # Landlord routes (protected)
│   │   ├── layout.tsx                   # Landlord sidebar navigation layout
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Landlord dashboard with stats
│   │   ├── properties/
│   │   │   ├── page.tsx                 # Properties list
│   │   │   └── [id]/
│   │   │       └── page.tsx             # Property details
│   │   ├── tenants/
│   │   │   └── page.tsx                 # Tenant management
│   │   ├── maintenance/
│   │   │   └── page.tsx                 # Maintenance request tracking
│   │   └── payments/
│   │       └── page.tsx                 # Payment tracking & history
│   │
│   ├── (tenant)/                        # Tenant routes (protected)
│   │   ├── layout.tsx                   # Tenant sidebar navigation layout
│   │   ├── portal/
│   │   │   └── page.tsx                 # Tenant dashboard
│   │   ├── payments/
│   │   │   └── page.tsx                 # Tenant payment management
│   │   ├── maintenance/
│   │   │   └── page.tsx                 # Submit maintenance requests
│   │   ├── messages/
│   │   │   └── page.tsx                 # Direct messaging
│   │   └── lease/
│   │       └── page.tsx                 # Lease agreement details
│   │
│   ├── search/                          # Public search/listing route
│   │   └── page.tsx                     # Property search & browsing
│   │
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Home page (public landing)
│   ├── globals.css                      # Global styles
│   └── (other)/
│       └── [optional additional pages]
│
├── components/
│   └── ui/                              # shadcn/ui components (pre-installed)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── radio-group.tsx
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── dropdown-menu.tsx
│       └── [... other shadcn components]
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # Supabase client-side setup
│   │   └── server.ts                    # Supabase server-side setup
│   ├── auth/
│   │   └── types.ts                     # Auth types & interfaces
│   └── utils.ts                         # Utility functions (cn helper)
│
├── public/                              # Static assets
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   ├── icon.svg
│   └── apple-icon.png
│
├── middleware.ts                        # Next.js middleware for auth routing
├── .env.local                           # Environment variables (local)
├── next.config.mjs                      # Next.js config
├── tsconfig.json                        # TypeScript config
├── tailwind.config.ts                   # Tailwind CSS config
├── postcss.config.mjs                   # PostCSS config
├── package.json
├── components.json                      # shadcn config
└── README.md
```

## Key Files Overview

### Environment Setup
- **.env.local**: Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **middleware.ts**: Routes authentication, redirects unauthorized users to /login

### Supabase Integration
- **lib/supabase/client.ts**: Client-side Supabase client for browser operations
- **lib/supabase/server.ts**: Server-side Supabase client for API routes and server components

### Root Layout Files
- **app/layout.tsx**: Root layout with metadata and body wrapper
- **app/page.tsx**: Public landing page with hero section and CTAs

### Auth Layout (Public)
- **app/(auth)/layout.tsx**: Centered card layout for login/signup pages
- **app/(auth)/login/page.tsx**: Email/password login form
- **app/(auth)/signup/page.tsx**: Registration form with role selection (Tenant/Landlord)

### Landlord Layout & Pages
- **app/(landlord)/layout.tsx**: Sidebar navigation + main content wrapper
  - Links: Dashboard, Properties, Tenants, Maintenance, Payments
- **app/(landlord)/dashboard/page.tsx**: Overview with stats cards and activity
- **app/(landlord)/properties/page.tsx**: List all managed properties
- **app/(landlord)/properties/[id]/page.tsx**: Property details, units, and stats
- **app/(landlord)/tenants/page.tsx**: Manage tenants across properties
- **app/(landlord)/maintenance/page.tsx**: Track maintenance requests by status
- **app/(landlord)/payments/page.tsx**: View collected rent and pending payments

### Tenant Layout & Pages
- **app/(tenant)/layout.tsx**: Sidebar navigation + main content wrapper
  - Links: Portal, Lease, Payments, Maintenance, Messages
- **app/(tenant)/portal/page.tsx**: Tenant dashboard with property info and rent status
- **app/(tenant)/payments/page.tsx**: Pay rent and view payment history
- **app/(tenant)/maintenance/page.tsx**: Submit and track maintenance requests
- **app/(tenant)/messages/page.tsx**: Direct messaging with landlord
- **app/(tenant)/lease/page.tsx**: View lease terms and details

### Public Pages
- **app/search/page.tsx**: Property search and listing (no login required)

## Route Structure Explanation

### Protected Routes vs Public Routes
```
Public (No Auth Required):
- /                                 (Home page)
- /login                            (Login)
- /signup                           (Sign up)
- /search                           (Property search)

Protected - Landlord Only:
- /landlord/dashboard               (Requires role: 'landlord')
- /landlord/properties
- /landlord/properties/[id]
- /landlord/tenants
- /landlord/maintenance
- /landlord/payments

Protected - Tenant Only:
- /tenant/portal                    (Requires role: 'tenant')
- /tenant/payments
- /tenant/maintenance
- /tenant/messages
- /tenant/lease
```

## Layout Nesting Hierarchy

```
Root Layout (app/layout.tsx)
├── Public Layout (home, search, etc.)
├── Auth Layout (app/(auth)/layout.tsx)
│   ├── Login Page
│   └── Signup Page
├── Landlord Layout (app/(landlord)/layout.tsx)
│   ├── Dashboard
│   ├── Properties
│   ├── Tenants
│   ├── Maintenance
│   └── Payments
└── Tenant Layout (app/(tenant)/layout.tsx)
    ├── Portal
    ├── Payments
    ├── Maintenance
    ├── Messages
    └── Lease
```

## Next Steps

1. **Connect Supabase**: Update `.env.local` with your Supabase credentials
2. **Database Schema**: Create tables for users, properties, tenants, and transactions
3. **Authentication Implementation**: Complete Supabase Auth integration in login/signup forms
4. **Role-Based Routing**: Enhance middleware.ts to verify user roles on protected routes
5. **API Routes**: Create `/app/api` routes for server-side operations (payments, maintenance, etc.)
6. **Styling**: Customize colors and typography using Tailwind tokens
7. **Testing**: Add unit and E2E tests for critical user flows
