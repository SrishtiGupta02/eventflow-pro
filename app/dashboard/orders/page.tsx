import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

interface TicketTierRow {
  id: string
  name: string
  price_minor: number
  currency: string
  quantity_total: number
  quantity_sold: number
  event_id: string
  event_title: string
}

interface TicketTierQueryRow {
  id: string
  name: string
  price_minor: number
  currency: string
  quantity_total: number
  quantity_sold: number
  event_id: string
  events?: { title: string } | { title: string }[] | null
}

function formatCurrency(minorUnits: number, currency = "INR") {
  const majorUnits = minorUnits / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(majorUnits)
}

export default async function DashboardOrdersPage() {
  const supabase = await createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id

  const { data: currentUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle()

  const tenantId = currentUser?.tenant_id

  const { data: tiers } = tenantId
    ? await supabase
        .from("ticket_tiers")
        .select("id,name,price_minor,currency,quantity_total,quantity_sold,event_id,events(title)")
        .eq("events.tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true })
    : { data: [] }

  const normalizedTiers: TicketTierRow[] = (tiers as TicketTierQueryRow[] | null)?.map((tier) => {
    const eventRelation = Array.isArray(tier.events) ? tier.events[0] : tier.events

    return {
      ...tier,
      event_title: eventRelation?.title ?? "",
    }
  }) ?? []

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Orders</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Create a new order
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Select a ticket tier and reserve seats for your event.
            </p>
          </div>
          <Link href="/dashboard/orders/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">New order</Button>
          </Link>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalizedTiers.map((tier) => (
              <TableRow key={tier.id}>
                <TableCell>{tier.event_title}</TableCell>
                <TableCell>{tier.name}</TableCell>
                <TableCell>{formatCurrency(tier.price_minor, tier.currency)}</TableCell>
                <TableCell>{tier.quantity_total - tier.quantity_sold}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
