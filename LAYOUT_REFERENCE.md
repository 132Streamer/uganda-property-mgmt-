import type { Metadata } from 'next'

/**
 * LAYOUT REFERENCE - PropertyHub SaaS
 * 
 * This file documents all layout.tsx files and their responsibilities
 */

// ============================================
// 1. ROOT LAYOUT (app/layout.tsx)
// ============================================
/**
 * Location: app/layout.tsx
 * 
 * Responsibilities:
 * - Wraps entire application
 * - Defines global metadata (title, description, icons)
 * - Sets up HTML and body tags
 * - Includes Analytics
 * - Sets background color class on html tag
 * 
 * Key Features:
 * - Metadata configuration for SEO
 * - Font setup (Geist Sans & Mono)
 * - Analytics tracking
 * 
 * children: All pages and nested layouts
 * 
 * Example:
 * export const metadata: Metadata = {
 *   title: 'PropertyHub - Property Management SaaS',
 *   description: 'Manage your properties and rentals with ease',
 * }
 */

// ============================================
// 2. AUTH LAYOUT (app/(auth)/layout.tsx)
// ============================================
/**
 * Location: app/(auth)/layout.tsx
 * 
 * Protected: No (public routes)
 * Routes:
 * - /login
 * - /signup
 * 
 * Responsibilities:
 * - Centers login/signup forms
 * - Provides consistent auth page styling
 * - Wraps children in centered container
 * 
 * Key Features:
 * - Centered flex layout
 * - Card-based form styling
 * - Min-height full screen
 * - Background color (muted)
 * 
 * Structure:
 * <div className="min-h-screen bg-muted flex items-center justify-center">
 *   <div className="w-full max-w-md">
 *     {children}
 *   </div>
 * </div>
 */

// ============================================
// 3. LANDLORD LAYOUT (app/(landlord)/layout.tsx)
// ============================================
/**
 * Location: app/(landlord)/layout.tsx
 * 
 * Protected: Yes (requires role: 'landlord')
 * Routes:
 * - /landlord/dashboard
 * - /landlord/properties
 * - /landlord/properties/[id]
 * - /landlord/tenants
 * - /landlord/maintenance
 * - /landlord/payments
 * 
 * Responsibilities:
 * - Provides persistent sidebar navigation
 * - Fixed left sidebar (w-64)
 * - Main content area with ml-64 margin
 * - Navigation links for landlord sections
 * 
 * Key Features:
 * - Left sidebar with:
 *   - PropertyHub logo
 *   - Navigation buttons (Dashboard, Properties, Tenants, Maintenance, Payments)
 *   - Profile and Logout buttons at bottom
 * - Main content area with padding (p-8)
 * - Logo acts as home link
 * - Responsive navigation
 * 
 * Structure:
 * <div className="min-h-screen bg-background">
 *   <aside className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border p-6">
 *     {/* Navigation */}
 *   </aside>
 *   <main className="ml-64 p-8">
 *     {children}
 *   </main>
 * </div>
 * 
 * Navigation Items:
 * - Dashboard: /landlord/dashboard
 * - Properties: /landlord/properties
 * - Tenants: /landlord/tenants
 * - Maintenance: /landlord/maintenance
 * - Payments: /landlord/payments
 * - Profile: /profile
 * - Logout: [button]
 */

// ============================================
// 4. TENANT LAYOUT (app/(tenant)/layout.tsx)
// ============================================
/**
 * Location: app/(tenant)/layout.tsx
 * 
 * Protected: Yes (requires role: 'tenant')
 * Routes:
 * - /tenant/portal
 * - /tenant/payments
 * - /tenant/maintenance
 * - /tenant/messages
 * - /tenant/lease
 * 
 * Responsibilities:
 * - Provides persistent sidebar navigation
 * - Fixed left sidebar (w-64)
 * - Main content area with ml-64 margin
 * - Navigation links for tenant sections
 * 
 * Key Features:
 * - Left sidebar with:
 *   - PropertyHub logo
 *   - Navigation buttons (Portal, Lease, Payments, Maintenance, Messages)
 *   - Profile and Logout buttons at bottom
 * - Main content area with padding (p-8)
 * - Logo acts as home link
 * - Responsive navigation
 * 
 * Structure:
 * <div className="min-h-screen bg-background">
 *   <aside className="fixed left-0 top-0 w-64 h-screen bg-card border-r border-border p-6">
 *     {/* Navigation */}
 *   </aside>
 *   <main className="ml-64 p-8">
 *     {children}
 *   </main>
 * </div>
 * 
 * Navigation Items:
 * - Portal: /tenant/portal
 * - Lease: /tenant/lease
 * - Payments: /tenant/payments
 * - Maintenance Requests: /tenant/maintenance
 * - Messages: /tenant/messages
 * - Profile: /profile
 * - Logout: [button]
 */

// ============================================
// LAYOUT NESTING DIAGRAM
// ============================================
/**
 * 
 * Root Layout
 * │
 * ├─ Public Pages
 * │  ├─ /               (Home page - no parent layout needed)
 * │  └─ /search         (Search/Browse - no parent layout needed)
 * │
 * ├─ Auth Layout (/(auth))
 * │  ├─ /login          (LoginPage wrapped in centered layout)
 * │  └─ /signup         (SignupPage wrapped in centered layout)
 * │
 * ├─ Landlord Layout (/(landlord))
 * │  ├─ /landlord/dashboard          (Dashboard + sidebar)
 * │  ├─ /landlord/properties         (Properties list + sidebar)
 * │  ├─ /landlord/properties/[id]    (Property details + sidebar)
 * │  ├─ /landlord/tenants           (Tenant list + sidebar)
 * │  ├─ /landlord/maintenance       (Maintenance tracker + sidebar)
 * │  └─ /landlord/payments          (Payment tracking + sidebar)
 * │
 * └─ Tenant Layout (/(tenant))
 *    ├─ /tenant/portal              (Tenant dashboard + sidebar)
 *    ├─ /tenant/payments            (Payment management + sidebar)
 *    ├─ /tenant/maintenance         (Maintenance requests + sidebar)
 *    ├─ /tenant/messages            (Messaging + sidebar)
 *    └─ /tenant/lease               (Lease details + sidebar)
 */

// ============================================
// LAYOUT CSS PATTERNS
// ============================================
/**
 * 
 * Common Layout Classes:
 * 
 * Min-height full screen:
 * - className="min-h-screen"
 * 
 * Sidebar pattern:
 * - fixed left-0 top-0 w-64 h-screen   (Fixed sidebar)
 * - ml-64                               (Margin left for main content)
 * 
 * Flexbox layouts:
 * - flex items-center justify-between  (Row with space-between)
 * - flex flex-col                      (Column layout)
 * 
 * Spacing:
 * - p-6                                (Padding: 1.5rem)
 * - p-8                                (Padding: 2rem)
 * - gap-4                              (Gap between items)
 * 
 * Colors & Borders:
 * - bg-background                      (Primary background)
 * - bg-card                            (Card background)
 * - bg-muted                           (Muted/secondary background)
 * - border-b border-border             (Bottom border)
 * - border-r border-border             (Right border)
 * 
 * Typography:
 * - text-foreground                    (Primary text color)
 * - text-muted-foreground              (Secondary text color)
 * - font-sans                          (Apply font family)
 * - antialiased                        (Text rendering)
 */

// ============================================
// METADATA PATTERNS
// ============================================
/**
 * 
 * Root Level Metadata:
 * export const metadata: Metadata = {
 *   title: 'PropertyHub - Property Management SaaS',
 *   description: 'Manage your properties and rentals with ease',
 *   icons: { ... }
 * }
 * 
 * Layout-specific Metadata:
 * export const metadata: Metadata = {
 *   title: 'Authentication - PropertyHub',
 *   description: 'Login or sign up for PropertyHub',
 * }
 * 
 * Or inherited from parent, only override if needed.
 */

export default function LayoutReferenceGuide() {
  return (
    <div>
      <h1>Layout Reference Guide</h1>
      <p>This is a documentation file. See comments above for layout reference.</p>
    </div>
  )
}
