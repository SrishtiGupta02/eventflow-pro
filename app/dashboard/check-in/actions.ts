"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export type CheckInFormState = {
  formError?: string
  fieldErrors?: Record<string, string>
  successMessage?: string
  ticket?: {
    ticketCode: string
    qrSignature: string
    holderName: string
    holderEmail?: string | null
    status: string
    eventTitle?: string | null
  }
} | null

function normalizeScanPayload(value: string | null) {
  if (!value) return ""
  const raw = value.toString().trim()
  if (!raw) return ""
  if (raw.startsWith("TICKET:")) return raw.slice(7).trim()
  if (raw.startsWith("QR:")) return raw.slice(3).trim()
  return raw
}

async function getTenantId(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("users").select("tenant_id").maybeSingle()
  if (error) throw error
  return data?.tenant_id ?? null
}

async function getCurrentUserId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user?.id ?? null
}

async function insertCheckInAudit(
  supabase: SupabaseClient,
  ticketId: string,
  eventId: string,
  tenantId: string,
  staffId: string,
  status: string,
  gateName: string
) {
  const { error } = await supabase.from("check_ins").insert({
    ticket_id: ticketId,
    event_id: eventId,
    tenant_id: tenantId,
    checked_in_by: staffId,
    status,
    gate_name: gateName,
    device_info: "web",
  })
  return error
}

export async function checkInTicket(
  _prevState: CheckInFormState,
  formData: FormData
): Promise<CheckInFormState> {
  const rawInput = formData.get("ticketCode")?.toString() ?? ""
  const ticketCode = normalizeScanPayload(rawInput)
  const gateName = formData.get("gateName")?.toString().trim() ?? "Main gate"

  if (!ticketCode) {
    return { formError: "Scan a valid ticket QR or enter the ticket code." }
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

  const staffId = await getCurrentUserId(supabase)
  if (!staffId) {
    return { formError: "Unable to identify your account. Please sign in again." }
  }

  const { data: ticketData, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id,order_id,event_id,tenant_id,holder_name,holder_email,status,ticket_code,qr_signature,ticket_tiers(name),events(title)"
    )
    .eq("ticket_code", ticketCode)
    .maybeSingle()

  if (ticketError) {
    return { formError: "Unable to look up the ticket. Please try again." }
  }

  let ticket = ticketData
  if (!ticket) {
    const { data: signatureTicketData, error: signatureError } = await supabase
      .from("tickets")
      .select(
        "id,order_id,event_id,tenant_id,holder_name,holder_email,status,ticket_code,qr_signature,ticket_tiers(name),events(title)"
      )
      .eq("qr_signature", ticketCode)
      .maybeSingle()

    if (signatureError) {
      return { formError: "Unable to look up the ticket. Please try again." }
    }

    ticket = signatureTicketData
  }

  if (!ticket) {
    return { formError: "Ticket not found. Enter the ticket code or scan the QR again." }
  }

  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", ticket.order_id)
    .maybeSingle()

  if (orderError || !orderData) {
    return { formError: "Unable to validate ticket payment state. Please try again." }
  }

  if (orderData.status !== "paid") {
    return {
      formError:
        "This ticket is not ready for check-in yet. Payment must be approved before the ticket can be admitted.",
    }
  }

  if (ticket.status === "checked_in") {
    await insertCheckInAudit(
      supabase,
      ticket.id,
      ticket.event_id,
      ticket.tenant_id,
      staffId,
      "duplicate",
      gateName
    )

    return {
      formError: "Ticket already checked in. Duplicate scan recorded.",
      ticket: {
        ticketCode: ticket.ticket_code,
        qrSignature: ticket.qr_signature,
        holderName: ticket.holder_name,
        holderEmail: ticket.holder_email,
        status: ticket.status,
        eventTitle: ticket.events?.title,
      },
    }
  }

  if (ticket.status !== "issued") {
    await insertCheckInAudit(
      supabase,
      ticket.id,
      ticket.event_id,
      ticket.tenant_id,
      staffId,
      "invalid",
      gateName
    )

    return {
      formError: "This ticket is not valid for entry.",
      ticket: {
        ticketCode: ticket.ticket_code,
        qrSignature: ticket.qr_signature,
        holderName: ticket.holder_name,
        holderEmail: ticket.holder_email,
        status: ticket.status,
        eventTitle: ticket.events?.title,
      },
    }
  }

  const { data: updatedTicket, error: updateError } = await supabase
    .from("tickets")
    .update({ status: "checked_in" })
    .eq("id", ticket.id)
    .eq("status", "issued")
    .select()
    .maybeSingle()

  if (updateError) {
    return { formError: "Unable to update ticket state. Please try again." }
  }

  if (!updatedTicket) {
    const { data: currentTicket } = await supabase
      .from("tickets")
      .select("status")
      .eq("id", ticket.id)
      .maybeSingle()

    if (currentTicket?.status === "checked_in") {
      await insertCheckInAudit(
        supabase,
        ticket.id,
        ticket.event_id,
        ticket.tenant_id,
        staffId,
        "duplicate",
        gateName
      )

      return {
        formError: "Ticket already checked in. Duplicate scan recorded.",
        ticket: {
          ticketCode: ticket.ticket_code,
          qrSignature: ticket.qr_signature,
          holderName: ticket.holder_name,
          holderEmail: ticket.holder_email,
          status: "checked_in",
          eventTitle: ticket.events?.title,
        },
      }
    }

    return { formError: "Unable to complete the check-in. Please try again." }
  }

  const auditError = await insertCheckInAudit(
    supabase,
    ticket.id,
    ticket.event_id,
    ticket.tenant_id,
    staffId,
    "success",
    gateName
  )

  if (auditError) {
    return { formError: "Checked in the ticket, but failed to save the scan audit." }
  }

  return {
    successMessage: "Ticket checked in successfully.",
    ticket: {
      ticketCode: updatedTicket.ticket_code,
      qrSignature: updatedTicket.qr_signature,
      holderName: updatedTicket.holder_name,
      holderEmail: updatedTicket.holder_email,
      status: updatedTicket.status,
      eventTitle: updatedTicket.events?.title,
    },
  }
}
