"use server"

import { redirect } from "next/navigation"
import type { SupabaseClient, User } from "@supabase/supabase-js"
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

// Same provisioning step performed at signup (see provisionProfile in
// app/signup/actions.ts), repeated here because that path is skipped when
// email confirmation is required — there's no session yet at signup time,
// so the tenant/owner row never gets created until the user's first login.
// Safe to call on every login: it first checks whether a profile already
// exists and no-ops if so.
async function provisionProfile(supabase: SupabaseClient, user: User) {
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existing) return

  const orgName = user.user_metadata?.org_name ?? ""
  const fullName = user.user_metadata?.full_name ?? ""

  if (!orgName) {
    throw new Error("Missing organization name on user metadata")
  }

  const { error: rpcError } = await supabase.rpc("provision_tenant_and_owner", {
    p_org_name: orgName,
    p_full_name: fullName,
  })
  if (rpcError) throw rpcError

  // The access token from signInWithPassword was minted before this profile
  // (and its tenant_id/role claims) existed. Force a refresh so the session
  // cookie carries a token with the correct claims before /dashboard loads.
  await supabase.auth.refreshSession()
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

  try {
    await provisionProfile(supabase, data.user)
  } catch {
    return {
      formError:
        "Your account exists, but we couldn't finish setting up your organization. Please try again or contact support.",
    }
  }

  redirect("/dashboard")
}