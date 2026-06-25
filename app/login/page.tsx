"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { GitBranch, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push("/dashboard"), 900)
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your EventFlow Pro account"
    >
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Button type="button" variant="outline" className="w-full">
            <GitBranch data-icon="inline-start" />
            Continue with GitHub
          </Button>

          <FieldSeparator>or</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              defaultValue="amara@eventflow.pro"
              required
            />
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              defaultValue="password"
              required
            />
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="remember" defaultChecked />
            <FieldLabel htmlFor="remember" className="font-normal">
              Remember me for 30 days
            </FieldLabel>
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Sign in
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}
