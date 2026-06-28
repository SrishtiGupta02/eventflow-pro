"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"
import { createClient } from "@/lib/supabase/client"
import { resetPassword, type ResetPasswordFormState } from "./actions"

const initialState: ResetPasswordFormState = null

type LinkStatus = "checking" | "ready" | "invalid"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking")
  const [state, formAction, pending] = useActionState(resetPassword, initialState)

  // The recovery link lands here as `/reset-password?code=...`. The browser
  // Supabase client (lib/supabase/client.ts) auto-detects that code on
  // construction and exchanges it for a session, emitting PASSWORD_RECOVERY
  // once done. We never call exchangeCodeForSession ourselves here — doing
  // so would consume the single-use code a second time.
  useEffect(() => {
    const supabase = createClient()
    let recoveryDetected = false

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryDetected = true
        setLinkStatus("ready")
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (recoveryDetected) return
      setLinkStatus(data.session ? "ready" : "invalid")
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError)
    }
  }, [state])

  useEffect(() => {
    if (state?.successMessage) {
      toast.success(state.successMessage)
      const timeout = setTimeout(() => {
        router.push("/login")
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [state, router])

  if (state?.successMessage) {
    return (
      <AuthShell title="Password reset" subtitle="You're all set">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Redirecting you to sign in…
        </p>
      </AuthShell>
    )
  }

  if (linkStatus === "checking") {
    return (
      <AuthShell title="Verifying your link" subtitle="Just a moment">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </AuthShell>
    )
  }

  if (linkStatus === "invalid") {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This password reset link is invalid or has expired"
      >
        <div className="flex flex-col gap-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <ShieldAlert className="size-6" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Reset links can only be used once and expire after a short time.
            Request a new one to continue.
          </p>
          <Button render={<Link href="/forgot-password" />}>
            Request a new link
          </Button>
          <Button variant="ghost" render={<Link href="/login" />}>
            <ArrowLeft data-icon="inline-start" />
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your account"
    >
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your new password"
              aria-invalid={!!state?.fieldErrors?.password}
              required
            />
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
            <FieldError
              errors={
                state?.fieldErrors?.password
                  ? [{ message: state.fieldErrors.password }]
                  : undefined
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
              required
            />
            <FieldError
              errors={
                state?.fieldErrors?.confirmPassword
                  ? [{ message: state.fieldErrors.confirmPassword }]
                  : undefined
              }
            />
          </Field>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Reset password
          </Button>
        </FieldGroup>
      </form>
    </AuthShell>
  )
}
