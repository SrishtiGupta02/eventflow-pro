import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

interface OrderRow {
  id: string
  buyer_name: string
  buyer_email: string
  status: string
  total_amount_minor: number
  currency: string
  event_id: string
}

interface TicketSummaryRow {
  ticket_tier_id: string
  ticket_tiers?: Array<{
    name: string
  }>
  events?: Array<{
    title: string
  }>
}

interface TicketDetailRow {
  ticket_code: string
  qr_signature: string
  status: string
  holder_name: string
  holder_email?: string | null
}

function formatCurrency(minorUnits: number, currency = "INR") {
  const majorUnits = minorUnits / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(majorUnits)
}

interface Props {
  params: { orderId: string }
}

export default async function OrderPage({ params }: Props) {
  const supabase = await createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id

  const { data: currentUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle()

  const tenantId = currentUser?.tenant_id

  const [orderResult, ticketSummaryResult, ticketDetailResult, ticketCountResult] = tenantId
    ? await Promise.all([
        supabase
          .from("orders")
          .select("id,buyer_name,buyer_email,status,total_amount_minor,currency,event_id")
          .eq("id", params.orderId)
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabase
          .from("tickets")
          .select("ticket_tier_id,ticket_tiers(name),events(title)")
          .eq("order_id", params.orderId)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tickets")
          .select("ticket_code,qr_signature,status,holder_name,holder_email")
          .eq("order_id", params.orderId),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("order_id", params.orderId),
      ])
    : [
        { data: null },
        { data: null },
        { data: [] as TicketDetailRow[] },
        { data: null, count: 0, error: null },
      ]

  const order = orderResult.data
  const ticketSummary = ticketSummaryResult.data
  const ticketDetails = ticketDetailResult.data ?? []
  const quantity = ticketCountResult.count ?? 0

  if (!order || !ticketSummary || quantity === 0) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link href="/dashboard/orders" className="text-sm text-primary hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  const pricePerTicket = quantity > 0 ? order.total_amount_minor / quantity : 0
  const checkedInCount = ticketDetails.filter((ticket) => ticket.status === "checked_in").length

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Order summary</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Order #{order.id}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Review your ticket purchase details before payment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_minmax(320px,1fr)]">
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Event name</TableCell>
                  <TableCell>{ticketSummary.events?.[0]?.title ?? "Unknown event"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ticket tier</TableCell>
                  <TableCell>{ticketSummary.ticket_tiers?.[0]?.name ?? "Unknown tier"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Quantity</TableCell>
                  <TableCell>{quantity}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Price per ticket</TableCell>
                  <TableCell>{formatCurrency(pricePerTicket, order.currency)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total amount</TableCell>
                  <TableCell>{formatCurrency(order.total_amount_minor, order.currency)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Order status</TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="rounded-3xl border border-border/70 bg-background p-6">
            <p className="text-sm font-medium text-muted-foreground">Next steps</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your order has been reserved. Complete the payment flow outside this screen.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">
                Back to orders
              </Link>
              <Button variant="outline">Download order details</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
