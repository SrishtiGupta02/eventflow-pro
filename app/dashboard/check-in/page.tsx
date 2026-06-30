"use client"

import { useEffect } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { checkInTicket, type CheckInFormState } from "./actions"

const initialState: CheckInFormState = null

export default function CheckInPage() {
  const [state, formAction, pending] = useActionState(checkInTicket, initialState)

  useEffect(() => {
    if (state?.formError) {
      // no-op: field errors already display inline
    }
  }, [state])

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm shadow-muted/10">
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground">Check in</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Scan ticket QR or enter ticket code
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Use this page to validate tickets, prevent duplicate check-ins, and record audit history.
          </p>
        </div>

        <form action={formAction} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ticketCode">Ticket QR or code</FieldLabel>
              <Input
                id="ticketCode"
                name="ticketCode"
                placeholder="Scan or paste ticket code / QR payload"
                aria-invalid={!!state?.formError}
                required
                autoFocus
              />
              <FieldError
                errors={state?.formError ? [{ message: state.formError }] : undefined}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="gateName">Gate name</FieldLabel>
              <Input
                id="gateName"
                name="gateName"
                placeholder="Main gate"
                defaultValue="Main gate"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="scanDate">Event day</FieldLabel>
              <Input id="scanDate" name="scanDate" type="date" />
            </Field>

            {state?.successMessage ? (
              <div className="rounded-3xl border border-success/50 bg-success/10 p-4 text-sm text-success">
                {state.successMessage}
              </div>
            ) : null}

            {state?.ticket ? (
              <div className="rounded-3xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Attendee</p>
                <p>{state.ticket.holderName}</p>
                <p>{state.ticket.holderEmail ?? "No email provided"}</p>
                <p className="mt-3 font-semibold text-foreground">Ticket</p>
                <p>Code: {state.ticket.ticketCode}</p>
                <p>Status: {state.ticket.status}</p>
                <p>Event: {state.ticket.eventTitle ?? "Unknown event"}</p>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Checking in..." : "Check in ticket"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
