import Link from "next/link"
import { Star } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Link href="/" aria-label="EventFlow Pro home" className="w-fit">
          <BrandLogo />
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-5 fill-primary-foreground text-primary-foreground" />
            ))}
          </div>
          <div>
            <blockquote className="text-balance text-2xl font-medium leading-snug text-primary-foreground">
              &ldquo;EventFlow Pro turned our messy spreadsheets into a single,
              beautiful command center. We sold out our last event in 48
              hours.&rdquo;
            </blockquote>
            <div className="mt-6">
              <div className="font-semibold text-primary-foreground">
                Amara Okafor
              </div>
              <div className="text-sm text-primary-foreground/70">
                Founder, LagosTech Summit
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 border-t border-primary-foreground/20 pt-8">
            {[
              { v: "4,200+", l: "Organizers" },
              { v: "$48M", l: "Processed" },
              { v: "1.2M", l: "Check-ins" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-xl font-semibold text-primary-foreground">
                  {s.v}
                </div>
                <div className="text-xs text-primary-foreground/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
