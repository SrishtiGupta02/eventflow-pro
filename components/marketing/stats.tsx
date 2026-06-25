const stats = [
  { value: "4,200+", label: "Active organizers" },
  { value: "$48M", label: "Tickets processed" },
  { value: "1.2M", label: "Attendees checked in" },
  { value: "99.98%", label: "Uptime guarantee" },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
