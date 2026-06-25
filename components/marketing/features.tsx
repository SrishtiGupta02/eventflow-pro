import {
  CalendarPlus,
  Ticket,
  ShieldCheck,
  QrCode,
  BarChart3,
  Building2,
} from "lucide-react"

const features = [
  {
    icon: CalendarPlus,
    title: "Create events in minutes",
    description:
      "A guided multi-step builder with cover images, categories, venues and capacity controls. Publish or save as a draft.",
  },
  {
    icon: Ticket,
    title: "Flexible ticket tiers",
    description:
      "Sell VIP, General, Early Bird and Student tickets with per-tier pricing, availability and perks.",
  },
  {
    icon: ShieldCheck,
    title: "Manual payment verification",
    description:
      "Review bank transfer screenshots and UTR numbers, then approve or reject payments in one click.",
  },
  {
    icon: QrCode,
    title: "Lightning-fast check-in",
    description:
      "Scan QR codes or enter ticket codes manually with clear success, error and already-checked-in states.",
  },
  {
    icon: BarChart3,
    title: "Analytics that matter",
    description:
      "Track revenue, sales, visitors and conversion with beautiful charts and top-selling event breakdowns.",
  },
  {
    icon: Building2,
    title: "Multi-tenant by design",
    description:
      "Switch between organizations, brand your subdomain and invite team members with the right roles.",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">Everything you need</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One platform for the entire event lifecycle
        </h2>
        <p className="mt-4 text-pretty text-muted-foreground">
          From the first invite to the final check-in, EventFlow Pro replaces
          your patchwork of spreadsheets and tools.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
