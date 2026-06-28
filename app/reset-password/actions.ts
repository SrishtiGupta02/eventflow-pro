"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/lib/validations/reset-password"

export type ResetPasswordFormState = {
  formError?: string
  fieldErrors?: Record<string, string>
  successMessage?: string
} | null

function flattenFieldErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === "string" && !out[key]) {
      out[key] = issue.message
    }
  }
  return out
}

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase()
  if (normalized.includes("session")) {
    return "This reset link has expired or was already used. Please request a new one."
  }
  if (normalized.includes("different") || normalized.includes("same password")) {
    return "Your new password must be different from your current password."
  }
  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  return "Something went wrong resetting your password. Please try again."
}

// The recovery session this relies on is established client-side, in
// app/reset-password/page.tsx, via the browser Supabase client's automatic
// PKCE code exchange (see lib/supabase/client.ts). By the time this action
// runs, that session should already be present in cookies.
export async function resetPassword(
  _prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password")?.toString() ?? "",
    confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
  })

  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.issues) }
  }

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    return { formError: "Unable to reach the server. Please try again." }
  }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return {
      formError:
        "This reset link has expired or was already used. Please request a new one.",
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { formError: mapAuthError(error.message) }
  }

  // Require the user to sign in fresh with the new password rather than
  // continuing on the recovery session.
  await supabase.auth.signOut()

  return {
    successMessage:
      "Your password has been reset. You can now sign in with your new password.",
  }
}