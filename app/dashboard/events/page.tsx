import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty } from "@/components/ui/empty"
import { deleteEvent } from "./actions"

interface EventRow {
  id: string
  title: string
  slug: string
  status: string
  start_at: string
  end_at: string
  visibility: string
}

interface EventFormData {
  id?: string
  title?: string
  slug?: string
  description?: string
  category?: string
  venueName?: string
  venueAddress?: string
  city?: string
  timezone?: string
  startAt?: string
  endAt?: string
  visibility?: string
  maxCapacity?: number
}

function formatDate(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}

export default async function DashboardEventsPage() {
  const supabase = await createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user.id

  const { data: currentUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle()

  const tenantId = currentUser?.tenant_id

  const { data: events } = tenantId
    ? await supabase
        .from("events")
        .select("id,title,slug,status,start_at,end_at,visibility")
        .eq("tenant_id", tenantId)
        .order("start_at", { ascending: true })
    : { data: [] }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Event management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Manage your events
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create, edit, and delete events for your workspace.
            </p>
          </div>
          <Link href="/dashboard/events/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">New event</Button>
          </Link>
        </div>

        {events?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.status}</TableCell>
                  <TableCell>{event.visibility}</TableCell>
                  <TableCell>{formatDate(event.start_at)}</TableCell>
                  <TableCell>{formatDate(event.end_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/dashboard/events/${event.id}/edit`}
                        className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                      >
                        Edit
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="eventId" value={event.id} />
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
              <p className="text-lg font-semibold text-foreground">No events yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first event to start selling tickets and tracking orders.
              </p>
            </div>
          </Empty>
        )}
      </div>
    </div>
  )
}
