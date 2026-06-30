"use client"

import Link from "next/link"
import { useEffect } from "react"
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
import { createTicketTier, type TicketTierFormState } from "../actions"

const initialState: TicketTierFormState = null

export default function NewTicketTierPage() {
  const params = useParams<{ eventId: string }>()
  const eventId = params.eventId
  const [state, formAction, pending] = useActionState(createTicketTier, initialState)

  useEffect(() => {
    if (state?.formError) {
      toast.error(state.formError)
    }
  }, [state])

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
          <p className="text-sm font-medium text-muted-foreground">New tier</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Create a ticket tier
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add a new ticket tier for this event and set its pricing and availability.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="eventId" value={eventId} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Tier name</FieldLabel>
              <Input id="name" name="name" placeholder="General admission" required />
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
                placeholder="What's included with this tier"
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
                placeholder="499.00"
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
              <Input id="currency" value="INR" disabled />
              <FieldDescription>Only INR is currently supported.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="quantityTotal">Total quantity</FieldLabel>
              <Input
                id="quantityTotal"
                name="quantityTotal"
                type="number"
                min={1}
                placeholder="100"
                required
              />
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
                defaultValue={1}
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
              <Input id="maxPerOrder" name="maxPerOrder" type="number" min={1} placeholder="10" />
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
              <Input id="saleStartAt" name="saleStartAt" type="datetime-local" />
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
              <Input id="saleEndAt" name="saleEndAt" type="datetime-local" />
              <FieldError
                errors={
                  state?.fieldErrors?.saleEndAt
                    ? [{ message: state.fieldErrors.saleEndAt }]
                    : undefined
                }
              />
            </Field>

            <Field orientation="horizontal">
              <Checkbox id="isActive" name="isActive" defaultChecked />
              <FieldLabel htmlFor="isActive" className="font-normal">
                Active
              </FieldLabel>
            </Field>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Create tier
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
