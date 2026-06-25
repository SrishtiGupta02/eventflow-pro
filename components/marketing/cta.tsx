import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center sm:px-12">
        <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
          Ready to run your best event yet?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-primary-foreground/80">
          Join thousands of organizers using EventFlow Pro to sell more tickets
          and create seamless experiences.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            variant="secondary"
            render={<Link href="/signup" />}
          >
            Start for free
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            render={<Link href="/dashboard" />}
          >
            Explore the demo
          </Button>
        </div>
      </div>
    </section>
  )
}
