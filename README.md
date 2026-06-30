# EventFlow Pro

White-label, multi-tenant event management prototype for ticket sales, manual UPI verification, QR ticketing, and gate check-in.

## Current Status

Implemented:
- Supabase Auth pages: signup, login, forgot/reset password, protected dashboard routing.
- Multi-tenant data model with RLS migrations for tenants, users, events, ticket tiers, orders, payments, tickets, check-ins, verification queue, and jobs.
- Organizer dashboard with event creation/editing and ticket tier creation/editing.
- Atomic order reservation RPC that locks tier inventory and issues ticket rows.
- Manual UPI submission and organizer approval flow backed by `verification_queue`.
- Queue-ready job records for UPI review, ticket QR asset generation, and ticket email notification.
- Web check-in page with duplicate-scan prevention and day-aware validation support.

Not implemented yet:
- Razorpay checkout/webhook route handlers.
- Cloudinary direct upload widget/API for payment screenshots and QR/PDF assets.
- Supabase Realtime client subscriptions for live order/payment/check-in dashboards.
- Public attendee checkout pages by event slug/subdomain/domain.
- Student ID upload/review UI.
- Worker process for the `jobs` table.
- Deployment, private GitHub sharing, and Loom walkthrough.

## Tech Stack

- Next.js App Router with TypeScript
- Supabase PostgreSQL/Auth/RLS
- Tailwind CSS and shadcn-style UI components
- Cloudinary and Razorpay integration points planned

Note: this repo currently uses Next.js `16.2.6`. The original brief asked for Next.js 14, so either downgrade deliberately or document the accepted version change before final delivery.

## Setup

```bash
npm install
npm.cmd run dev
```

PowerShell on Windows may block `npm`; use `npm.cmd` if you see an execution policy error.

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Needed for the remaining payment/asset work
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Database

Run migrations in `supabase/migrations` in filename order.

Important migrations:
- `001_initial_schema.sql`: core tables, constraints, indexes, triggers.
- `002_rls.sql`: tenant isolation and role-aware RLS policies.
- `0003_signup_provisioning.sql`: signup tenant/user provisioning RPC.
- `0004_order_checkout_transaction.sql`: atomic ticket reservation RPC.
- `0005_tenant_tiers_day_scans.sql`: direct `ticket_tiers.tenant_id`, event-day validity fields, and updated checkout RPC.

## Scalability Decisions

- Tenant isolation is enforced in PostgreSQL through RLS, not only in UI filters.
- Server actions/API-style handlers are stateless and derive tenant context from Supabase auth each request.
- Ticket reservation uses a database transaction and row lock to prevent overselling.
- Slow operations are represented as rows in `jobs`, ready for a worker or scheduled function.
- Payment verification is separated from the financial ledger through `verification_queue`.
- Core query paths include tenant/status/date indexes in the schema.
- Tenant soft limits are modeled on `tenants.settings` and should be enforced in route handlers before production.

## Verification

```bash
npm.cmd run build
```

Known local issue: `npm.cmd run lint` currently fails because `eslint` is not installed even though the script exists.
