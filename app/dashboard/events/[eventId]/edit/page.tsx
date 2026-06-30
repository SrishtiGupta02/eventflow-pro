import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty } from "@/components/ui/empty"
import { deleteTicketTier } from "./ticket-tiers/actions"

interface EventSummary {
  id: string
  title: string
}

interface TicketTierRow {
  id: string
  name: string
  price_minor: number
  currency: string
  quantity_total: number
  quantity_sold: number
  is_active: boolean
}

interface Props {
  params: { eventId: string }
}

function formatCurrency(minorUnits: number, currency = "INR") {
  const majorUnits = minorUnits / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(majorUnits)
}

export default async function TicketTiersPage({ params }: Props) {
  const supabase = await createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id

  const { data: currentUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle()

  const tenantId = currentUser?.tenant_id

  const { data: event } = tenantId
    ? await supabase
        .from("events")
        .select("id,title")
        .eq("tenant_id", tenantId)
        .eq("id", params.eventId)
        .maybeSingle<EventSummary>()
    : { data: null }

  if (!event) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <p className="text-sm text-muted-foreground">Event not found.</p>
        <Link href="/dashboard/events" className="text-sm text-primary hover:underline">
          Back to events
        </Link>
      </div>
    )
  }

  const { data: ticketTiers } = await supabase
    .from("ticket_tiers")
    .select("id,name,price_minor,currency,quantity_total,quantity_sold,is_active")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true })
    .returns<TicketTierRow[]>()

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <Link href="/dashboard/events" className="text-sm text-primary hover:underline">
          Back to events
        </Link>

        <div className="mb-8 mt-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ticket tier management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create, edit, and manage the ticket tiers available for this event.
            </p>
          </div>
          <Link href={`/dashboard/events/${event.id}/edit/ticket-tiers/new`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">New tier</Button>
          </Link>
        </div>

        {ticketTiers?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total quantity</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketTiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>{tier.name}</TableCell>
                  <TableCell>{formatCurrency(tier.price_minor, tier.currency)}</TableCell>
                  <TableCell>{tier.quantity_total}</TableCell>
                  <TableCell>{tier.quantity_sold}</TableCell>
                  <TableCell>{tier.quantity_total - tier.quantity_sold}</TableCell>
                  <TableCell>{tier.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/dashboard/events/${event.id}/edit/ticket-tiers/${tier.id}/edit`}
                        className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                      >
                        Edit
                      </Link>
                      <form action={deleteTicketTier}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="tierId" value={tier.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty>
            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold text-foreground">No ticket tiers yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first ticket tier to start selling tickets for this event.
              </p>
            </div>
          </Empty>
        )}
      </div>
    </div>
  )
}
