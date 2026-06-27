import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateEvent, type EventFormState } from "@/app/dashboard/events/actions"

const initialState: EventFormState = null

interface EventEditRow {
  id: string
  title: string
  slug: string
  description: string | null
  category: string | null
  venue_name: string | null
  venue_address: string | null
  city: string | null
  timezone: string
  start_at: string
  end_at: string
  visibility: string
  max_capacity: number | null
}

interface Props {
  params: { eventId: string }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
  return iso.slice(0, 16)
}

export default async function EditEventPage({ params }: Props) {
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
        .select(
          "id,title,slug,description,category,venue_name,venue_address,city,timezone,start_at,end_at,visibility,max_capacity"
        )
        .eq("tenant_id", tenantId)
        .eq("id", params.eventId)
        .maybeSingle()
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

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Edit event</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Update event details
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Change the event information and save your updates.
          </p>
        </div>

        <form action={updateEvent} className="space-y-6">
          <input type="hidden" name="eventId" value={event.id} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input id="title" name="title" defaultValue={event.title} required />
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input id="slug" name="slug" defaultValue={event.slug} />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" name="description" defaultValue={event.description ?? ""} />
            </Field>

            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input id="category" name="category" defaultValue={event.category ?? ""} />
            </Field>

            <Field>
              <FieldLabel htmlFor="venueName">Venue name</FieldLabel>
              <Input id="venueName" name="venueName" defaultValue={event.venue_name ?? ""} />
            </Field>

            <Field>
              <FieldLabel htmlFor="venueAddress">Venue address</FieldLabel>
              <Input id="venueAddress" name="venueAddress" defaultValue={event.venue_address ?? ""} />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" name="city" defaultValue={event.city ?? ""} />
            </Field>

            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <Select id="timezone" name="timezone" defaultValue={event.timezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="startAt">Start at</FieldLabel>
              <Input id="startAt" name="startAt" type="datetime-local" defaultValue={formatDateTime(event.start_at)} required />
            </Field>

            <Field>
              <FieldLabel htmlFor="endAt">End at</FieldLabel>
              <Input id="endAt" name="endAt" type="datetime-local" defaultValue={formatDateTime(event.end_at)} required />
            </Field>

            <Field>
              <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
              <Select id="visibility" name="visibility" defaultValue={event.visibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="maxCapacity">Maximum capacity</FieldLabel>
              <Input id="maxCapacity" name="maxCapacity" type="number" defaultValue={event.max_capacity ?? undefined} min={1} />
            </Field>

            <div className="flex items-center gap-3">
              <Button type="submit">Save changes</Button>
              <Link href="/dashboard/events" className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </Link>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
