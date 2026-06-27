"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { createOrder, type OrderFormState } from "@/app/dashboard/orders/actions"

const initialState: OrderFormState = null

export default function NewOrderPage() {
  const [state, formAction, pending] = useActionState(createOrder, initialState)

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">New order</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Checkout ticket tier
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Reserve tickets and create an order summary before payment.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="buyerName">Buyer name</FieldLabel>
              <Input id="buyerName" name="buyerName" placeholder="Your name" required />
              <FieldError
                errors={
                  state?.fieldErrors?.buyerName
                    ? [{ message: state.fieldErrors.buyerName }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="buyerEmail">Buyer email</FieldLabel>
              <Input id="buyerEmail" name="buyerEmail" type="email" placeholder="you@example.com" required />
              <FieldError
                errors={
                  state?.fieldErrors?.buyerEmail
                    ? [{ message: state.fieldErrors.buyerEmail }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="ticketTierId">Ticket tier ID</FieldLabel>
              <Input id="ticketTierId" name="ticketTierId" placeholder="Tier UUID" required />
              <FieldError
                errors={
                  state?.fieldErrors?.ticketTierId
                    ? [{ message: state.fieldErrors.ticketTierId }]
                    : undefined
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
              <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
              <FieldError
                errors={
                  state?.fieldErrors?.quantity
                    ? [{ message: state.fieldErrors.quantity }]
                    : undefined
                }
              />
            </Field>

            {state?.formError ? (
              <div className="rounded-3xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                {state.formError}
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Processing..." : "Reserve tickets"}
              </Button>
              <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </Link>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
