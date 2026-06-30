import { createClient } from "@/lib/supabase/server"

type DashboardUser = {
  id: string
  tenant_id: string | null
  email: string
  full_name?: string | null
}

type Tenant = {
  id: string
  name: string
}

type DashboardEvent = {
  id: string
  title: string
  start_at: string
}

type DashboardOrder = {
  id: string
  buyer_name: string
  status: string
  total_amount_minor: number
  currency: string
  created_at: string
}

function formatCurrency(minorUnits: number, currency = "INR") {
  const majorUnits = minorUnits / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(majorUnits)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user

  const userId = user?.id ?? null
  const { data: currentUser } = await supabase
    .from("users")
    .select("id,tenant_id,email,full_name")
    .eq("id", userId)
    .maybeSingle()

  const tenantId = currentUser?.tenant_id

  const [
    tenantResult,
    eventsCountResult,
    ticketTiersCountResult,
    ordersCountResult,
    paymentsCountResult,
    ticketsSoldCountResult,
    paidOrdersResult,
    recentEventsResult,
    recentOrdersResult,
  ] = await Promise.all([
    tenantId
      ? supabase.from("tenants").select("id,name").eq("id", tenantId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    tenantId
      ? supabase.from("events").select("id", { count: "exact", head: true }).eq(
          "tenant_id",
          tenantId
        )
      : Promise.resolve({ data: null, count: 0, error: null }),
    tenantId
      ? supabase
          .from("ticket_tiers")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
      : Promise.resolve({ data: null, count: 0, error: null }),
    tenantId
      ? supabase.from("orders").select("id", { count: "exact", head: true }).eq(
          "tenant_id",
          tenantId
        )
      : Promise.resolve({ data: null, count: 0, error: null }),
    tenantId
      ? supabase.from("payments").select("id", { count: "exact", head: true }).eq(
          "tenant_id",
          tenantId
        )
      : Promise.resolve({ data: null, count: 0, error: null }),
    tenantId
      ? supabase.from("tickets").select("id", { count: "exact", head: true }).eq(
          "tenant_id",
          tenantId
        )
      : Promise.resolve({ data: null, count: 0, error: null }),
    tenantId
      ? supabase
          .from("orders")
          .select("total_amount_minor")
          .eq("tenant_id", tenantId)
          .eq("status", "paid")
      : Promise.resolve({ data: [] as { total_amount_minor: number }[] }),
    tenantId
      ? supabase
          .from("events")
          .select("id,title,start_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as DashboardEvent[] }),
    tenantId
      ? supabase
          .from("orders")
          .select(
            "id,buyer_name,status,total_amount_minor,currency,created_at"
          )
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as DashboardOrder[] }),
  ])

  const totalEvents = eventsCountResult.count ?? 0
  const totalTicketTiers = ticketTiersCountResult.count ?? 0
  const totalOrders = ordersCountResult.count ?? 0
  const totalPayments = paymentsCountResult.count ?? 0
  const ticketsSold = ticketsSoldCountResult.count ?? 0
  const revenue =
    paidOrdersResult.data?.reduce(
      (total, order) => total + order.total_amount_minor,
      0
    ) ?? 0
  const currency = "INR"
  const recentEvents = recentEventsResult.data ?? []
  const recentOrders = recentOrdersResult.data ?? []

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_max-content]">
      <section className="space-y-6 rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {currentUser?.full_name ?? user?.user_metadata?.full_name ?? user?.email}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage your events, attendees, and organization settings all from one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Active events", value: totalEvents.toString() },
            { label: "Upcoming attendees", value: ticketsSold.toString() },
            { label: "Revenue this month", value: formatCurrency(revenue, currency) },
            { label: "Open tasks", value: totalOrders.toString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-border/70 bg-background p-5"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Quick links</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Your workspace</h2>
        </div>

        <div className="space-y-3">
          {[
            "Review event registrations",
            "Configure ticketing settings",
            "View check-in dashboard",
          ].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-border/70 bg-muted p-4 text-sm text-foreground"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="space-y-4 pt-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Recent events</p>
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-3xl border border-border/70 bg-background p-4 text-sm text-foreground"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border/70 bg-muted p-4 text-sm text-foreground">
                No recent events
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Recent orders</p>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-border/70 bg-background p-4 text-sm text-foreground"
                  >
                    {order.buyer_name} — {formatCurrency(order.total_amount_minor, order.currency)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border/70 bg-muted p-4 text-sm text-foreground">
                No recent orders
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
