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
  FieldDescription,
  FieldSeparator,
} from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => router.push("/dashboard"), 900)
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start selling tickets in minutes — no card required"
    >
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Button type="button" variant="outline" className="w-full">
            <GitBranch data-icon="inline-start" />
            Sign up with GitHub
          </Button>

          <FieldSeparator>or</FieldSeparator>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="first">First name</FieldLabel>
              <Input id="first" placeholder="Amara" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="last">Last name</FieldLabel>
              <Input id="last" placeholder="Okafor" required />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="org">Organization name</FieldLabel>
            <Input id="org" placeholder="LagosTech Summit" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              required
            />
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="terms" required />
            <FieldLabel htmlFor="terms" className="font-normal">
              I agree to the Terms of Service and Privacy Policy
            </FieldLabel>
          </Field>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Create account
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
