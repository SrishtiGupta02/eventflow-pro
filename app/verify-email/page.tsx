import Link from "next/link"
import { ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Check your inbox"
      subtitle="We sent a verification link to your email"
    >
      <div className="flex flex-col gap-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <MailCheck className="size-6" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Click the link in the email we just sent you to verify your
          address and finish setting up your account. Be sure to check your
          spam folder.
        </p>
        <Button variant="ghost" render={<Link href="/login" />}>
          <ArrowLeft data-icon="inline-start" />
          Back to sign in
        </Button>
      </div>
    </AuthShell>
  )
}