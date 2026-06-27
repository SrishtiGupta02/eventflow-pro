"use client"

import Link from "next/link"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { GitBranch, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
  FieldSeparator,
} from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"
import { signIn, type LoginFormState } from "./actions"

const initialState: LoginFormState = null

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError)
    }
  }, [state])

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your EventFlow Pro account"
    >
      <form action={formAction}>
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
              name="email"
              type="email"
              placeholder="you@company.com"
              defaultValue="amara@eventflow.pro"
              aria-invalid={!!state?.fieldErrors?.email}
              required
            />
            <FieldError
              errors={
                state?.fieldErrors?.email
                  ? [{ message: state.fieldErrors.email }]
                  : undefined
              }
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
              name="password"
              type="password"
              placeholder="Enter your password"
              defaultValue="password"
              aria-invalid={!!state?.fieldErrors?.password}
              required
            />
            <FieldError
              errors={
                state?.fieldErrors?.password
                  ? [{ message: state.fieldErrors.password }]
                  : undefined
              }
            />
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="remember" defaultChecked />
            <FieldLabel htmlFor="remember" className="font-normal">
              Remember me for 30 days
            </FieldLabel>
          </Field>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
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
