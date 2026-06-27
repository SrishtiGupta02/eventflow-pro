"use server"

import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { orderSchema } from "@/lib/validations/order"

export type OrderFormState = {
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
  const { data, error } = await supabase.from("users").select("tenant_id").maybeSingle()
  if (error) {
    throw error
  }
  return data?.tenant_id ?? null
}

export async function createOrder(
  _prevState: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const parsed = orderSchema.safeParse({
    buyerName: formData.get("buyerName")?.toString().trim() ?? "",
    buyerEmail: formData.get("buyerEmail")?.toString().trim() ?? "",
    ticketTierId: formData.get("ticketTierId")?.toString() ?? "",
    quantity: formData.get("quantity")?.toString() ?? "",
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

  const { data: tierData, error: tierError } = await supabase
    .from("ticket_tiers")
    .select("id,event_id,price_minor,currency,quantity_total,quantity_sold")
    .eq("id", parsed.data.ticketTierId)
    .maybeSingle()

  if (tierError) {
    return { formError: "Unable to load ticket tier details. Please try again." }
  }

  if (!tierData) {
    return { formError: "Selected ticket tier is unavailable." }
  }

  const available = tierData.quantity_total - tierData.quantity_sold
  if (parsed.data.quantity > available) {
    return { formError: `Only ${available} ticket(s) are available for this tier.` }
  }

  const totalAmountMinor = parsed.data.quantity * tierData.price_minor

  const transaction = await supabase.rpc("create_order_with_ticket_reservation", {
    p_ticket_tier_id: parsed.data.ticketTierId,
    p_quantity: parsed.data.quantity,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_email: parsed.data.buyerEmail,
    p_total_amount_minor: totalAmountMinor,
    p_currency: tierData.currency,
  })

  if (transaction.error) {
    return { formError: transaction.error.message }
  }

  const orderId = transaction.data as string | null
  if (!orderId) {
    return { formError: "Unable to confirm your order. Please try again." }
  }

  redirect(`/dashboard/orders/${orderId}`)
}
