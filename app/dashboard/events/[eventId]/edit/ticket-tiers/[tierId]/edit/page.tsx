"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useActionState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { createClient } from "@/lib/supabase/client"
import { updateTicketTier, type TicketTierFormState } from "../../actions"

const initialState: TicketTierFormState = null

interface TicketTierRecord {
  id: string
  event_id: string
  name: string
  description: string | null
  price_minor: number
  currency: string
  quantity_total: number
  quantity_sold: number
  sale_start_at: string | null
  sale_end_at: string | null
  min_per_order: number
  max_per_order: number | null
  is_active: boolean
}

function formatDateTime(value: string) {
  const date = new Date(value)
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()
  return iso.slice(0, 16)
}

type LoadStatus = "loading" | "ready" | "not-found"

export default function EditTicketTierPage() {
  const params = useParams<{ eventId: string; tierId: string }>()
  const { eventId, tierId } = params
  const [status, setStatus] = useState<LoadStatus>("loading")
  const [tier, setTier] = useState<TicketTierRecord | null>(null)
  const [state, formAction, pending] = useActionState(updateTicketTier, initialState)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from("ticket_tiers")
      .select(
        "id,event_id,name,description,price_minor,currency,quantity_total,quantity_sold,sale_start_at,sale_end_at,min_per_order,max_per_order,is_active"
      )
      .eq("id", tierId)
      .eq("event_id", eventId)
      .maybeSingle<TicketTierRecord>()
      .then(({ data }) => {
        if (data) {
          setTier(data)
          setStatus("ready")
        } else {
          setStatus("not-found")
        }
      })
  }, [eventId, tierId])

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError)
    }
  }, [state])

  if (status === "loading") {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </div>
    )
  }

  if (status === "not-found" || !tier) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <p className="text-sm text-muted-foreground">Ticket tier not found.</p>
        <Link
          href={`/dashboard/events/${eventId}/edit/ticket-tiers`}
          className="text-sm text-primary hover:underline"
        >
          Back to ticket tiers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <Link
          href={`/dashboard/events/${eventId}/edit/ticket-tiers`}
          className="text-sm text-primary hover:underline"
        >
          Back to ticket tiers
        </Link>

        <div className="mb-8 mt-4">
          <p className="text-sm font-medium text-muted-foreground">Edit tier</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Update ticket tier
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Change the ticket tier details and save your updates.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="tierId" value={tierId} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Tier name</FieldLabel>
              <Input id="name" name="name" defaultValue={tier.name} required />
              <FieldError
                errors={
                  state?.fieldErrors?.name
                    ? [{ message: state.fieldErrors.name }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                name="description"
                defaultValue={tier.description ?? ""}
              />
              <FieldError
                errors={
                  state?.fieldErrors?.description
                    ? [{ message: state.fieldErrors.description }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="price">Price</FieldLabel>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(tier.price_minor / 100).toFixed(2)}
                required
              />
              <FieldDescription>Enter the price in major currency units.</FieldDescription>
              <FieldError
                errors={
                  state?.fieldErrors?.price
                    ? [{ message: state.fieldErrors.price }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Input id="currency" defaultValue={tier.currency} disabled />
              <FieldDescription>Only INR is currently supported.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="quantityTotal">Total quantity</FieldLabel>
              <Input
                id="quantityTotal"
                name="quantityTotal"
                type="number"
                min={tier.quantity_sold}
                defaultValue={tier.quantity_total}
                required
              />
              <FieldDescription>
                {tier.quantity_sold} ticket{tier.quantity_sold === 1 ? "" : "s"} already sold.
                Total quantity cannot be reduced below this.
              </FieldDescription>
              <FieldError
                errors={
                  state?.fieldErrors?.quantityTotal
                    ? [{ message: state.fieldErrors.quantityTotal }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="minPerOrder">Minimum per order</FieldLabel>
              <Input
                id="minPerOrder"
                name="minPerOrder"
                type="number"
                min={1}
                defaultValue={tier.min_per_order}
              />
              <FieldError
                errors={
                  state?.fieldErrors?.minPerOrder
                    ? [{ message: state.fieldErrors.minPerOrder }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="maxPerOrder">Maximum per order</FieldLabel>
              <Input
                id="maxPerOrder"
                name="maxPerOrder"
                type="number"
                min={1}
                defaultValue={tier.max_per_order ?? undefined}
              />
              <FieldError
                errors={
                  state?.fieldErrors?.maxPerOrder
                    ? [{ message: state.fieldErrors.maxPerOrder }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="saleStartAt">Sale start</FieldLabel>
              <Input
                id="saleStartAt"
                name="saleStartAt"
                type="datetime-local"
                defaultValue={tier.sale_start_at ? formatDateTime(tier.sale_start_at) : ""}
              />
              <FieldError
                errors={
                  state?.fieldErrors?.saleStartAt
                    ? [{ message: state.fieldErrors.saleStartAt }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="saleEndAt">Sale end</FieldLabel>
              <Input
                id="saleEndAt"
                name="saleEndAt"
                type="datetime-local"
                defaultValue={tier.sale_end_at ? formatDateTime(tier.sale_end_at) : ""}
              />
              <FieldError
                errors={
                  state?.fieldErrors?.saleEndAt
                    ? [{ message: state.fieldErrors.saleEndAt }]
                    : undefined
                }
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox id="isActive" name="isActive" defaultChecked={tier.is_active} />
              <FieldLabel htmlFor="isActive" className="font-normal">
                Active
              </FieldLabel>
            </Field>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Save changes
              </Button>
              <Link
                href={`/dashboard/events/${eventId}/edit/ticket-tiers`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Link>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
