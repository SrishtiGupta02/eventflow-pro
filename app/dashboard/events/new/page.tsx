import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEvent } from "@/app/dashboard/events/actions"

export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">New event</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Create an event
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add the details for your next event and make it available to your attendees.
          </p>
        </div>

        <form action={createEvent} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input id="title" name="title" placeholder="Summer Concert" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input id="slug" name="slug" placeholder="summer-concert" />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" name="description" placeholder="Describe your event" />
            </Field>

            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <Input id="category" name="category" placeholder="Concert" />
            </Field>

            <Field>
              <FieldLabel htmlFor="venueName">Venue name</FieldLabel>
              <Input id="venueName" name="venueName" placeholder="The Grand Hall" />
            </Field>

            <Field>
              <FieldLabel htmlFor="venueAddress">Venue address</FieldLabel>
              <Input id="venueAddress" name="venueAddress" placeholder="123 Main St" />
            </Field>

            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input id="city" name="city" placeholder="Bangalore" />
            </Field>

            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <Select id="timezone" name="timezone" defaultValue="Asia/Kolkata">
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
              <Input id="startAt" name="startAt" type="datetime-local" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="endAt">End at</FieldLabel>
              <Input id="endAt" name="endAt" type="datetime-local" required />
            </Field>

            <Field>
              <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
              <Select id="visibility" name="visibility" defaultValue="public">
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
              <Input id="maxCapacity" name="maxCapacity" type="number" placeholder="100" min={1} />
            </Field>

            <div className="flex items-center gap-3">
              <Button type="submit">Create event</Button>
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
