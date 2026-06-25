import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    q: "How does ticket selling work?",
    a: "Create an event, define ticket tiers like VIP, General, Early Bird and Student, set pricing and availability, then publish. Buyers receive a QR-coded ticket instantly after payment.",
  },
  {
    q: "What is manual payment verification?",
    a: "For bank transfers and UPI payments, buyers upload a payment screenshot and UTR number. Your team reviews each one and approves or rejects it in a single click — fully auditable.",
  },
  {
    q: "Can I run multiple organizations?",
    a: "Yes. EventFlow Pro is multi-tenant. Switch between organizations from the top bar, each with its own branding, subdomain, team members and payment settings.",
  },
  {
    q: "How does check-in work on event day?",
    a: "Use the built-in QR scanner or enter ticket codes manually. The system clearly shows valid, already-checked-in and invalid states, plus a live counter of today's check-ins.",
  },
  {
    q: "Is there a free plan?",
    a: "Absolutely. The Starter plan is free forever and supports up to 100 tickets per event, perfect for your first few events.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. All paid plans are month-to-month with no long-term contracts. Cancel anytime and keep access until the end of your billing period.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">FAQ</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Frequently asked questions
        </h2>
      </div>

      <Accordion multiple={false} className="mt-10">
        {faqs.map((faq, i) => (
          <AccordionItem key={faq.q} value={`item-${i}`}>
            <AccordionTrigger className="text-base">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
