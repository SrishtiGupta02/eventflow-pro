"use server"

import { redirect } from "next/navigation"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { signupSchema } from "@/lib/validations/signup"

export type SignupFormState = {
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
  const m = message.toLowerCase()
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists."
  }
  if (m.includes("password")) {
    return message
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  return "Something went wrong creating your account. Please try again."
}

// Creates the tenant + owner profile row for a brand-new account, via the
// SECURITY DEFINER function in 0003_signup_provisioning.sql. Safe to call
// more than once for the same user (it no-ops if a profile already exists),
// which is what allows this to also run lazily on first login when email
// confirmation is enabled (see app/login when that flow is implemented).
async function provisionProfile(
  supabase: SupabaseClient,
  user: User,
  orgName: string,
  fullName: string
) {
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existing) return

  const { error: rpcError } = await supabase.rpc("provision_tenant_and_owner", {
    p_org_name: orgName,
    p_full_name: fullName,
  })
  if (rpcError) throw rpcError

  // The access token issued at sign-up time was minted before this profile
  // (and its tenant_id/role claims) existed. Force a refresh so the session
  // cookie carries a token with the correct claims before /dashboard loads.
  await supabase.auth.refreshSession()
}

export async function signup(
  _prevState: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get("first")?.toString().trim() ?? "",
    lastName: formData.get("last")?.toString().trim() ?? "",
    orgName: formData.get("org")?.toString().trim() ?? "",
    email: formData.get("email")?.toString().trim() ?? "",
    password: formData.get("password")?.toString() ?? "",
    terms: formData.get("terms")?.toString() ?? "",
  })

  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.issues) }
  }

  const { firstName, lastName, orgName, email, password } = parsed.data
  const fullName = `${firstName} ${lastName}`.trim()

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    return { formError: "Unable to reach the server. Please try again." }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, org_name: orgName },
    },
  })

  if (error) {
    return { formError: mapAuthError(error.message) }
  }

  if (!data.user) {
    return { formError: "Something went wrong creating your account. Please try again." }
  }

  if (!data.session) {
    // Email confirmation is required — there is no session yet, so the
    // tenant/profile cannot be provisioned now (RPC calls run as the
    // authenticated caller). It runs on first login instead.
    redirect("/verify-email")
  }

  try {
  await provisionProfile(supabase, data.user, orgName, fullName)
} catch (e) {
  console.error(e)

  return {
    formError: e instanceof Error ? e.message : JSON.stringify(e),
  }
}

  redirect("/dashboard")
}