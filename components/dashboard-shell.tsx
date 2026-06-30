"use client"

import { LogOut as Logout } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/dashboard/actions"
import type { User } from "@supabase/supabase-js"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type DashboardShellProps = {
  user: User
  children: ReactNode
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/events", label: "Events" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/check-in", label: "Check-in" },
]

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname()

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
        <nav className="mx-auto mt-6 flex max-w-6xl flex-wrap gap-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === link.href || pathname.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg border border-border/70 px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}