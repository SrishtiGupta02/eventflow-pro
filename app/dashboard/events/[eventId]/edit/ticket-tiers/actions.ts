"use server"

import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { ticketTierSchema } from "@/lib/validations/ticket-tier"

export type TicketTierFormState = {
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

// ticket_tiers has no tenant_id column — tenancy is only resolvable via the
// parent event, so every mutation must re-verify the event belongs to the
// caller's tenant before touching a tier row.
async function verifyEventOwnership(
  supabase: SupabaseClient,
  eventId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

export async function createTicketTier(
  _prevState: TicketTierFormState,
  formData: FormData
): Promise<TicketTierFormState> {
  const eventId = formData.get("eventId")?.toString() ?? ""
  const name = formData.get("name")?.toString().trim() ?? ""
  const description = formData.get("description")?.toString() ?? ""
  const price = formData.get("price")?.toString() ?? ""
  const currency = formData.get("currency")?.toString() ?? "INR"
  const quantityTotal = formData.get("quantityTotal")?.toString() ?? ""
  const saleStartAt = formData.get("saleStartAt")?.toString() ?? ""
  const saleEndAt = formData.get("saleEndAt")?.toString() ?? ""
  const minPerOrder = formData.get("minPerOrder")?.toString() ?? ""
  const maxPerOrder = formData.get("maxPerOrder")?.toString() ?? ""
  const isActive = formData.get("isActive")?.toString() ?? ""

  if (!eventId) {
    return { formError: "Missing event ID." }
  }

  const parsed = ticketTierSchema.safeParse({
    name,
    description,
    price,
    currency,
    quantityTotal,
    saleStartAt,
    saleEndAt,
    minPerOrder,
    maxPerOrder,
    isActive,
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

  const ownsEvent = await verifyEventOwnership(supabase, eventId, tenantId)
  if (!ownsEvent) {
    return { formError: "Event not found." }
  }

  const { error } = await supabase.from("ticket_tiers").insert({
    tenant_id: tenantId,
    event_id: eventId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_minor: Math.round(parsed.data.price * 100),
    currency: parsed.data.currency,
    quantity_total: parsed.data.quantityTotal,
    sale_start_at: parseTimestamp(parsed.data.saleStartAt ?? null),
    sale_end_at: parseTimestamp(parsed.data.saleEndAt ?? null),
    min_per_order: parsed.data.minPerOrder,
    max_per_order: parsed.data.maxPerOrder ?? null,
    is_active: parsed.data.isActive,
  })

  if (error) {
    return { formError: `Unable to create the ticket tier. ${error.message}` }
  }

  redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
}

export async function updateTicketTier(
  _prevState: TicketTierFormState,
  formData: FormData
): Promise<TicketTierFormState> {
  const eventId = formData.get("eventId")?.toString() ?? ""
  const tierId = formData.get("tierId")?.toString() ?? ""
  const name = formData.get("name")?.toString().trim() ?? ""
  const description = formData.get("description")?.toString() ?? ""
  const price = formData.get("price")?.toString() ?? ""
  const currency = formData.get("currency")?.toString() ?? "INR"
  const quantityTotal = formData.get("quantityTotal")?.toString() ?? ""
  const saleStartAt = formData.get("saleStartAt")?.toString() ?? ""
  const saleEndAt = formData.get("saleEndAt")?.toString() ?? ""
  const minPerOrder = formData.get("minPerOrder")?.toString() ?? ""
  const maxPerOrder = formData.get("maxPerOrder")?.toString() ?? ""
  const isActive = formData.get("isActive")?.toString() ?? ""

  if (!eventId || !tierId) {
    return { formError: "Missing ticket tier reference." }
  }

  const parsed = ticketTierSchema.safeParse({
    name,
    description,
    price,
    currency,
    quantityTotal,
    saleStartAt,
    saleEndAt,
    minPerOrder,
    maxPerOrder,
    isActive,
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

  const ownsEvent = await verifyEventOwnership(supabase, eventId, tenantId)
  if (!ownsEvent) {
    return { formError: "Event not found." }
  }

  const { data: existingTier, error: fetchError } = await supabase
    .from("ticket_tiers")
    .select("quantity_sold")
    .eq("id", tierId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (fetchError || !existingTier) {
    return { formError: "Ticket tier not found." }
  }

  if (parsed.data.quantityTotal < existingTier.quantity_sold) {
    return {
      formError: `Total quantity cannot be less than the ${existingTier.quantity_sold} tickets already sold.`,
    }
  }

  const { error } = await supabase
    .from("ticket_tiers")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_minor: Math.round(parsed.data.price * 100),
      currency: parsed.data.currency,
      quantity_total: parsed.data.quantityTotal,
      sale_start_at: parseTimestamp(parsed.data.saleStartAt ?? null),
      sale_end_at: parseTimestamp(parsed.data.saleEndAt ?? null),
      min_per_order: parsed.data.minPerOrder,
      max_per_order: parsed.data.maxPerOrder ?? null,
      is_active: parsed.data.isActive,
    })
    .eq("id", tierId)
    .eq("event_id", eventId)

  if (error) {
    return { formError: `Unable to update the ticket tier. ${error.message}` }
  }

  redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
}

export async function deleteTicketTier(formData: FormData) {
  const eventId = formData.get("eventId")?.toString() ?? ""
  const tierId = formData.get("tierId")?.toString() ?? ""

  if (!eventId || !tierId) {
    redirect("/dashboard/events")
  }

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
  }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
  }

  const ownsEvent = await verifyEventOwnership(supabase, eventId, tenantId)
  if (!ownsEvent) {
    redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
  }

  const { data: existingTier } = await supabase
    .from("ticket_tiers")
    .select("quantity_sold")
    .eq("id", tierId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (!existingTier) {
    redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
  }

  if (existingTier.quantity_sold > 0) {
    redirect(`/dashboard/events/${eventId}/edit/ticket-tiers?error=has_sales`)
  }

  await supabase
    .from("ticket_tiers")
    .delete()
    .eq("id", tierId)
    .eq("event_id", eventId)

  redirect(`/dashboard/events/${eventId}/edit/ticket-tiers`)
}
