"use server"

import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { loginSchema } from "@/lib/validations/login"

export type LoginFormState = {
  formError?: string
  fieldErrors?: Record<string, string>
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
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password") ||
    normalized.includes("invalid login")
  ) {
    return "Invalid email or password."
  }
  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("confirm your email") ||
    normalized.includes("email confirmation")
  ) {
    return "Please verify your email before signing in."
  }
  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  return "Something went wrong signing in. Please try again."
}

export async function signIn(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email")?.toString().trim() ?? "",
    password: formData.get("password")?.toString() ?? "",
  })

  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.issues) }
  }

  const { email, password } = parsed.data

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    return { formError: "Unable to reach the server. Please try again." }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (
      error.message.toLowerCase().includes("email not confirmed") ||
      error.message.toLowerCase().includes("confirm your email")
    ) {
      redirect("/verify-email")
    }
    return { formError: mapAuthError(error.message) }
  }

  if (!data.user) {
    return { formError: "Something went wrong signing in. Please try again." }
  }

  if (!data.session) {
    redirect("/verify-email")
  }

  redirect("/dashboard")
}
