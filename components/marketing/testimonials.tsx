import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote:
      "We replaced four different tools with EventFlow Pro. Selling tickets and verifying bank transfers used to take days — now it's minutes.",
    name: "Amara Okafor",
    role: "Founder, LagosTech Summit",
    avatar: "/avatar-woman-1.png",
  },
  {
    quote:
      "Check-in day used to be chaos. The QR scanner and manual code fallback meant zero lines at the door for 2,000 attendees.",
    name: "Liam Chen",
    role: "Ops Lead, Sunset Sessions",
    avatar: "/avatar-man-1.png",
  },
  {
    quote:
      "The analytics are gorgeous and genuinely useful. I finally understand which events and tiers actually drive revenue.",
    name: "Sofia Rossi",
    role: "Director, DesignConf",
    avatar: "/avatar-woman-2.png",
  },
  {
    quote:
      "Multi-org support is a lifesaver. I run events for three different brands from a single login with separate branding.",
    name: "Marcus Bell",
    role: "Producer, Bell Events Co.",
    avatar: "/avatar-man-2.png",
  },
  {
    quote:
      "Manual payment verification with screenshot previews is exactly what our market needed. Approvals are instant and auditable.",
    name: "Priya Nair",
    role: "Community Lead, BuildersDAO",
    avatar: "/avatar-woman-3.png",
  },
  {
    quote:
      "It feels like a product built by people who've actually run events. Every detail is thought through.",
    name: "Diego Martín",
    role: "Founder, StartupGrind LA",
    avatar: "/avatar-man-4.png",
  },
]

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="border-y border-border bg-secondary/40"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Testimonials</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Trusted by organizers everywhere
          </h2>
        </div>

        <div className="mt-12 columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="break-inside-avoid rounded-2xl border border-border bg-card p-6"
            >
              <blockquote className="text-sm leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={t.avatar || "/placeholder.svg"} alt={t.name} />
                  <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
