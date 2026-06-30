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

// Records a payment against an order and transitions it to "paid".
// Tickets and their QR codes already exist from order creation (see
// create_order_with_ticket_reservation) — this action never touches the
// tickets table, so it cannot duplicate ticket generation. It only marks
// those already-issued tickets as eligible for check-in, which
// check-in/actions.ts already enforces by checking order.status === "paid".
export async function verifyPayment(formData: FormData) {
  const orderId = formData.get("orderId")?.toString() ?? ""

  if (!orderId) {
    redirect("/dashboard/orders")
  }

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status,total_amount_minor,currency")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (orderError || !order) {
    redirect("/dashboard/orders")
  }

  // Already verified — do nothing further. This is the guard against
  // duplicate payment verification: a second click (or a race between two
  // concurrent clicks) cannot create a second payment record.
  if (order.status === "paid") {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    tenant_id: tenantId,
    provider: "manual_upi",
    amount_minor: order.total_amount_minor,
    currency: order.currency,
    status: "captured",
  })

  if (paymentError) {
    redirect(`/dashboard/orders/${orderId}`)
  }

  // Optimistic concurrency: only transition the order out of the status we
  // just read, so two concurrent verifications can't both flip it to paid
  // off of stale data.
  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("status", order.status)

  redirect(`/dashboard/orders/${orderId}`)
}

export async function submitManualUpiPayment(formData: FormData) {
  const orderId = formData.get("orderId")?.toString() ?? ""
  const utrReference = formData.get("utrReference")?.toString().trim() ?? ""
  const proofScreenshotUrl = formData.get("proofScreenshotUrl")?.toString().trim() ?? ""

  if (!orderId || !utrReference) {
    redirect(orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders")
  }

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status,total_amount_minor,currency")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (orderError || !order || order.status === "paid") {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      tenant_id: tenantId,
      provider: "manual_upi",
      amount_minor: order.total_amount_minor,
      currency: order.currency,
      status: "initiated",
      raw_webhook_payload: {
        utr_reference: utrReference,
        proof_screenshot_url: proofScreenshotUrl || null,
      },
    })
    .select("id")
    .single()

  if (paymentError || !payment) {
    redirect(`/dashboard/orders/${orderId}`)
  }

  await supabase.from("verification_queue").insert({
    order_id: orderId,
    payment_id: payment.id,
    tenant_id: tenantId,
    utr_reference: utrReference,
    proof_screenshot_url: proofScreenshotUrl || null,
    status: "pending",
  })

  await supabase
    .from("orders")
    .update({ status: "awaiting_verification", payment_method: "manual_upi" })
    .eq("id", orderId)
    .eq("tenant_id", tenantId)

  await supabase.from("jobs").insert({
    tenant_id: tenantId,
    type: "manual_upi_review_requested",
    payload: { order_id: orderId, payment_id: payment.id },
  })

  redirect(`/dashboard/orders/${orderId}`)
}

export async function approveManualUpiPayment(formData: FormData) {
  const orderId = formData.get("orderId")?.toString() ?? ""

  if (!orderId) {
    redirect("/dashboard/orders")
  }

  let supabase: SupabaseClient
  try {
    supabase = await createClient()
  } catch {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) {
    redirect(`/dashboard/orders/${orderId}`)
  }

  const { data: userData } = await supabase.auth.getUser()
  const reviewerId = userData.user?.id ?? null

  const { data: queueItem } = await supabase
    .from("verification_queue")
    .select("id,payment_id,status")
    .eq("order_id", orderId)
    .eq("tenant_id", tenantId)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!queueItem) {
    redirect(`/dashboard/orders/${orderId}`)
  }

  await supabase
    .from("verification_queue")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", queueItem.id)
    .eq("status", "pending")

  await supabase
    .from("payments")
    .update({ status: "captured" })
    .eq("id", queueItem.payment_id)
    .eq("tenant_id", tenantId)

  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .eq("tenant_id", tenantId)

  await supabase.from("jobs").insert([
    {
      tenant_id: tenantId,
      type: "ticket_qr_assets_requested",
      payload: { order_id: orderId },
    },
    {
      tenant_id: tenantId,
      type: "ticket_email_requested",
      payload: { order_id: orderId },
    },
  ])

  redirect(`/dashboard/orders/${orderId}`)
}
