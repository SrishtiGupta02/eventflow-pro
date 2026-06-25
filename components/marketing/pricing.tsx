import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "For your first event and small gatherings.",
    features: [
      "Up to 100 tickets/event",
      "1 organizer seat",
      "Basic analytics",
      "QR check-in",
      "Email support",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "/mo",
    description: "For growing teams running events regularly.",
    features: [
      "Unlimited tickets",
      "5 organizer seats",
      "Advanced analytics",
      "Manual payment verification",
      "Custom subdomain",
      "Priority support",
    ],
    cta: "Start 14-day trial",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$149",
    period: "/mo",
    description: "For high-volume, multi-brand organizers.",
    features: [
      "Everything in Growth",
      "Unlimited seats",
      "Multi-organization",
      "API access",
      "Dedicated manager",
      "SSO & audit logs",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">Pricing</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Simple pricing that scales with you
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          No setup fees. No hidden ticket charges. Cancel anytime.
        </p>
      </div>

      <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-7",
              plan.highlighted
                ? "border-primary shadow-xl shadow-primary/10 lg:-translate-y-2"
                : "border-border",
            )}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most popular
              </Badge>
            )}
            <h3 className="text-lg font-semibold text-foreground">
              {plan.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.description}
            </p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-foreground">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {plan.period}
              </span>
            </div>

            <Button
              className="mt-6 w-full"
              variant={plan.highlighted ? "default" : "outline"}
              render={<Link href="/signup" />}
            >
              {plan.cta}
            </Button>

            <ul className="mt-7 flex flex-col gap-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm text-foreground"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                    <Check className="size-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
