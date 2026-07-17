/**
 * SidebarUserFooter
 *
 * Drop this at the bottom of your sidebar, replacing any existing
 * placeholder profile / logout buttons.
 *
 * Usage in your sidebar layout (e.g. app/(landlord)/layout.tsx):
 *
 *   import { SidebarUserFooter } from '@/components/auth/sidebar-user-footer'
 *
 *   // Inside the async layout component:
 *   const profile = await getProfile()
 *
 *   // In the JSX, at the bottom of the sidebar:
 *   <SidebarUserFooter profile={profile} />
 */

import { getProfile } from '@/lib/actions/auth'
import { ProfileDialog } from '@/components/auth/profile-dialog'
import { LogoutButton } from '@/components/auth/logout-button'
import { Separator } from '@/components/ui/separator'

export async function SidebarUserFooter() {
  const profile = await getProfile()

  if (!profile) return null

  return (
    <div className="mt-auto">
      <Separator className="mb-2" />
      <div className="px-2 pb-2 space-y-1">
        {/* Profile button — opens view/edit dialog */}
        <ProfileDialog profile={profile} />

        {/* Logout */}
        <LogoutButton />
      </div>
    </div>
  )
}
