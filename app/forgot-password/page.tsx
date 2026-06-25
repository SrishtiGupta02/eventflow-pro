"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 900)
  }

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={
        sent
          ? "We sent a password reset link to your email"
          : "Enter your email and we'll send you a reset link"
      }
    >
      {sent ? (
        <div className="flex flex-col gap-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <MailCheck className="size-6" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If an account exists for that email, you&apos;ll receive a link to
            reset your password within a few minutes. Be sure to check your spam
            folder.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Resend email
          </Button>
          <Button variant="ghost" render={<Link href="/login" />}>
            <ArrowLeft data-icon="inline-start" />
            Back to sign in
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                )}
                Send reset link
              </Button>
            </FieldGroup>
          </form>
          <Button
            variant="ghost"
            className="mt-4 w-full"
            render={<Link href="/login" />}
          >
            <ArrowLeft data-icon="inline-start" />
            Back to sign in
          </Button>
        </>
      )}
    </AuthShell>
  )
}
