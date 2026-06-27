"use server"

import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { eventSchema } from "@/lib/validations/event"

export type EventFormState = {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function getTenantId(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("users")
    .select("tenant_id")
    .maybeSingle()

  if (error) {
    throw error
  }

  return data?.tenant_id ?? null
}

function parseTimestamp(value: string | null): string | null {
  if (!value) {
    return null
  }

  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) {
    return null
  }

  return timestamp.toISOString()
}

export async function createEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const title = formData.get("title")?.toString().trim() ?? ""
  const rawSlug = formData.get("slug")?.toString().trim() ?? ""
  const slug = rawSlug || slugify(title)
  const description = formData.get("description")?.toString().trim() ?? ""
  const category = formData.get("category")?.toString().trim() ?? ""
  const venueName = formData.get("venueName")?.toString().trim() ?? ""
  const venueAddress = formData.get("venueAddress")?.toString().trim() ?? ""
  const city = formData.get("city")?.toString().trim() ?? ""
  const timezone = formData.get("timezone")?.toString().trim() ?? ""
  const visibility = formData.get("visibility")?.toString() ?? "public"
  const startAt = formData.get("startAt")?.toString() ?? ""
  const endAt = formData.get("endAt")?.toString() ?? ""
  const maxCapacity = formData.get("maxCapacity")?.toString() ?? ""

  const parsed = eventSchema.safeParse({
    title,
    slug,
    description,
    category,
    venueName,
    venueAddress,
    city,
    timezone,
    visibility,
    startAt,
    endAt,
    maxCapacity,
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

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    return { formError: "Unable to identify your workspace. Please sign in again." }
  }

  const user = await supabase.auth.getUser()
  const organizerId = user.data.user?.id
  if (!organizerId) {
    return { formError: "Unable to identify your account. Please sign in again." }
  }

  const { error } = await supabase.from("events").insert({
    tenant_id: tenantId,
    organizer_id: organizerId,
    title: parsed.data.title,
    slug: parsed.data.slug || slugify(parsed.data.title),
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    venue_name: parsed.data.venueName || null,
    venue_address: parsed.data.venueAddress || null,
    city: parsed.data.city || null,
    timezone: parsed.data.timezone,
    start_at: parseTimestamp(parsed.data.startAt),
    end_at: parseTimestamp(parsed.data.endAt),
    visibility: parsed.data.visibility,
    max_capacity: parsed.data.maxCapacity ?? null,
  })

  if (error) {
    return { formError: `Unable to create the event. ${error.message}` }
  }

  redirect("/dashboard/events")
}

export async function updateEvent(
  _prevState: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const eventId = formData.get("eventId")?.toString() ?? ""
  const title = formData.get("title")?.toString().trim() ?? ""
  const rawSlug = formData.get("slug")?.toString().trim() ?? ""
  const slug = rawSlug || slugify(title)
  const description = formData.get("description")?.toString().trim() ?? ""
  const category = formData.get("category")?.toString().trim() ?? ""
  const venueName = formData.get("venueName")?.toString().trim() ?? ""
  const venueAddress = formData.get("venueAddress")?.toString().trim() ?? ""
  const city = formData.get("city")?.toString().trim() ?? ""
  const timezone = formData.get("timezone")?.toString().trim() ?? ""
  const visibility = formData.get("visibility")?.toString() ?? "public"
  const startAt = formData.get("startAt")?.toString() ?? ""
  const endAt = formData.get("endAt")?.toString() ?? ""
  const maxCapacity = formData.get("maxCapacity")?.toString() ?? ""

  if (!eventId) {
    return { formError: "Missing event ID." }
  }

  const parsed = eventSchema.safeParse({
    title,
    slug,
    description,
    category,
    venueName,
    venueAddress,
    city,
    timezone,
    visibility,
    startAt,
    endAt,
    maxCapacity,
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

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    return { formError: "Unable to identify your workspace. Please sign in again." }
  }

  const { error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug || slugify(parsed.data.title),
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      venue_name: parsed.data.venueName || null,
      venue_address: parsed.data.venueAddress || null,
      city: parsed.data.city || null,
      timezone: parsed.data.timezone,
      start_at: parseTimestamp(parsed.data.startAt),
      end_at: parseTimestamp(parsed.data.endAt),
      visibility: parsed.data.visibility,
      max_capacity: parsed.data.maxCapacity ?? null,
    })
    .eq("id", eventId)
    .eq("tenant_id", tenantId)

  if (error) {
    return { formError: `Unable to update the event. ${error.message}` }
  }

  redirect("/dashboard/events")
}

export async function deleteEvent(formData: FormData) {
  const eventId = formData.get("eventId")?.toString() ?? ""

  if (!eventId) {
    redirect("/dashboard/events")
  }

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    redirect("/dashboard/events")
  }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    redirect("/dashboard/events")
  }

  await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("tenant_id", tenantId)

  redirect("/dashboard/events")
}
