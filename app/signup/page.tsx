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
  FieldDescription,
  FieldError,
  FieldSeparator,
} from "@/components/ui/field"
import { AuthShell } from "@/components/auth/auth-shell"
import { signup, type SignupFormState } from "./actions"

const initialState: SignupFormState = null

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState)

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError)
    }
  }, [state])

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start selling tickets in minutes — no card required"
    >
      <form action={formAction}>
        <FieldGroup>
          <Button type="button" variant="outline" className="w-full">
            <GitBranch data-icon="inline-start" />
            Sign up with GitHub
          </Button>

          <FieldSeparator>or</FieldSeparator>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="first">First name</FieldLabel>
              <Input
                id="first"
                name="first"
                placeholder="Amara"
                aria-invalid={!!state?.fieldErrors?.firstName}
                required
              />
              <FieldError
                errors={
                  state?.fieldErrors?.firstName
                    ? [{ message: state.fieldErrors.firstName }]
                    : undefined
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="last">Last name</FieldLabel>
              <Input
                id="last"
                name="last"
                placeholder="Okafor"
                aria-invalid={!!state?.fieldErrors?.lastName}
                required
              />
              <FieldError
                errors={
                  state?.fieldErrors?.lastName
                    ? [{ message: state.fieldErrors.lastName }]
                    : undefined
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="org">Organization name</FieldLabel>
            <Input
              id="org"
              name="org"
              placeholder="LagosTech Summit"
              aria-invalid={!!state?.fieldErrors?.orgName}
              required
            />
            <FieldError
              errors={
                state?.fieldErrors?.orgName
                  ? [{ message: state.fieldErrors.orgName }]
                  : undefined
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
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

          <Field orientation="horizontal">
            <Checkbox
              id="terms"
              name="terms"
              aria-invalid={!!state?.fieldErrors?.terms}
              required
            />
            <FieldLabel htmlFor="terms" className="font-normal">
              I agree to the Terms of Service and Privacy Policy
            </FieldLabel>
          </Field>
          <FieldError
            errors={
              state?.fieldErrors?.terms
                ? [{ message: state.fieldErrors.terms }]
                : undefined
            }
          />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
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