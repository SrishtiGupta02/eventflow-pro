import { LogOut as Logout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/dashboard/actions"
import type { User } from "@supabase/supabase-js"
import type { ReactNode } from "react"

export type DashboardShellProps = {
  user: User
  children: ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/70 bg-muted px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Signed in as</p>
            <p className="text-base font-semibold text-foreground">{user.user_metadata?.full_name ?? user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <form action={logout} className="flex w-full justify-start sm:w-auto">
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              <Logout data-icon="inline-start" />
              Logout
            </Button>
          </form>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
