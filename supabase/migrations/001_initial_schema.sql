-- =============================================================================
-- EventFlow Pro — Initial Schema Migration
-- Target: PostgreSQL 16 / Supabase
-- Scope: Tables, constraints, indexes, trigger functions, triggers ONLY.
--        No RLS, no policies, no storage buckets, no auth hooks,
--        no edge functions, no seed data, no API/TypeScript code.
--
-- Conventions:
--   * All primary keys are uuid.
--   * Monetary values are stored as integers in minor units (e.g. paise).
--   * "Status"-style fields are `text` + named CHECK constraints rather than
--     native Postgres ENUM types, so adding a new status value later is a
--     one-line ALTER TABLE instead of an ALTER TYPE migration.
--   * Section 2 (Tables) defines column shape only: data type, NOT NULL,
--     DEFAULT. Section 3 (Constraints) adds PRIMARY KEY, FOREIGN KEY
--     (with ON DELETE behavior), CHECK, and UNIQUE constraints by name,
--     via ALTER TABLE, so each constraint is independently identifiable
--     and modifiable in future migrations.
--   * Tables are created in dependency order so every FK target already
--     exists at the point its referencing table is created.
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

-- gen_random_uuid() has been a built-in core PostgreSQL function since
-- PostgreSQL 13 (it is no longer provided exclusively by pgcrypto). On
-- PostgreSQL 16 / current Supabase images, no extension is required for it.
-- pgcrypto is intentionally NOT enabled here because nothing in this schema
-- needs it. If a future migration needs hmac()/digest() (e.g. server-side
-- verification of QR ticket signatures), enable it there:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================================
-- 2. TABLES (dependency order)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 tenants — root entity, no dependencies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
    id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
    name                 text        NOT NULL,
    slug                 text        NOT NULL,
    custom_domain        text,
    logo_url             text,
    brand_color          text,
    plan_tier            text        NOT NULL DEFAULT 'free',
    status               text        NOT NULL DEFAULT 'active',
    razorpay_account_id  text,
    settings             jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tenants IS 'Root multi-tenant entity. One row per organizer organization / white-label customer.';
COMMENT ON COLUMN public.tenants.slug IS 'Subdomain segment: {slug}.eventflowpro.com. Unique platform-wide.';
COMMENT ON COLUMN public.tenants.custom_domain IS 'Optional white-label custom domain mapped to this tenant.';
COMMENT ON COLUMN public.tenants.settings IS 'Flexible per-tenant config (default currency, timezone, feature flags) to avoid schema migrations for tenant-level options.';

-- -----------------------------------------------------------------------------
-- 2.2 users — depends on tenants (and conceptually on auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id              uuid        NOT NULL, -- no default: must equal auth.users.id, supplied at creation time
    tenant_id       uuid,
    email           text        NOT NULL,
    full_name       text,
    phone           text,
    role            text        NOT NULL DEFAULT 'staff',
    is_active       boolean     NOT NULL DEFAULT true,
    last_login_at   timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Dashboard-facing accounts only (owners, staff, super_admins). Ticket buyers/holders are NOT represented here — they are guest data on orders/tickets.';
COMMENT ON COLUMN public.users.id IS 'Mirrors auth.users.id — the profile row''s identity is the Supabase Auth user''s identity.';
COMMENT ON COLUMN public.users.tenant_id IS 'NULL only for role = super_admin (platform-level accounts).';
COMMENT ON COLUMN public.users.is_active IS 'Soft-revoke flag so staff access can be disabled without deleting their audit history (check_ins, verification_queue reviews).';

-- -----------------------------------------------------------------------------
-- 2.3 events — depends on tenants, users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id                uuid        NOT NULL DEFAULT gen_random_uuid(),
    tenant_id         uuid        NOT NULL,
    organizer_id      uuid        NOT NULL,
    title             text        NOT NULL,
    slug              text        NOT NULL,
    description       text,
    category          text,
    venue_name        text,
    venue_address     text,
    city              text,
    timezone          text        NOT NULL,
    start_at          timestamptz NOT NULL,
    end_at            timestamptz NOT NULL,
    cover_image_url   text,
    status            text        NOT NULL DEFAULT 'draft',
    visibility        text        NOT NULL DEFAULT 'public',
    max_capacity      integer,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.events IS 'A single event owned by a tenant.';
COMMENT ON COLUMN public.events.slug IS 'Public URL segment, unique per tenant (not globally unique).';
COMMENT ON COLUMN public.events.timezone IS 'IANA timezone name; event times must render correctly regardless of viewer locale.';
COMMENT ON COLUMN public.events.max_capacity IS 'Venue-level cap, independent of the sum of ticket_tiers.quantity_total.';

-- -----------------------------------------------------------------------------
-- 2.4 ticket_tiers — depends on events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_tiers (
    id               uuid        NOT NULL DEFAULT gen_random_uuid(),
    event_id         uuid        NOT NULL,
    name             text        NOT NULL,
    description      text,
    price_minor      integer     NOT NULL,
    currency         text        NOT NULL DEFAULT 'INR',
    quantity_total   integer     NOT NULL,
    quantity_sold    integer     NOT NULL DEFAULT 0,
    sale_start_at    timestamptz,
    sale_end_at      timestamptz,
    min_per_order    integer     NOT NULL DEFAULT 1,
    max_per_order    integer,
    is_active        boolean     NOT NULL DEFAULT true,
    sort_order       integer     NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ticket_tiers IS 'Pricing/inventory tiers within an event (e.g. Early Bird, VIP, General).';
COMMENT ON COLUMN public.ticket_tiers.price_minor IS 'Price in smallest currency unit (paise for INR) — integer to avoid float rounding errors.';
COMMENT ON COLUMN public.ticket_tiers.quantity_sold IS 'Denormalized counter for fast availability checks. Must only be incremented inside the same transaction that inserts the corresponding tickets rows, with row-level locking, to prevent overselling under concurrent checkouts.';

-- -----------------------------------------------------------------------------
-- 2.5 orders — depends on tenants, events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    tenant_id           uuid        NOT NULL,
    event_id            uuid        NOT NULL,
    buyer_name          text        NOT NULL,
    buyer_email         text        NOT NULL,
    buyer_phone         text,
    total_amount_minor  integer     NOT NULL,
    currency            text        NOT NULL DEFAULT 'INR',
    status              text        NOT NULL DEFAULT 'pending',
    payment_method      text,
    idempotency_key     text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'A single checkout transaction. One order can contain multiple tickets across multiple tiers.';
COMMENT ON COLUMN public.orders.idempotency_key IS 'Client-supplied key preventing duplicate order creation on retried/double-submitted checkout requests.';
COMMENT ON COLUMN public.orders.buyer_name IS 'The payer — distinct from per-ticket holder_name on tickets, since a buyer may purchase on behalf of others.';

-- -----------------------------------------------------------------------------
-- 2.6 tickets — depends on orders, ticket_tiers, events, tenants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tickets (
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    order_id        uuid        NOT NULL,
    ticket_tier_id  uuid        NOT NULL,
    event_id        uuid        NOT NULL,
    tenant_id       uuid        NOT NULL,
    holder_name     text        NOT NULL,
    holder_email    text,
    holder_phone    text,
    ticket_code     text        NOT NULL,
    qr_signature    text        NOT NULL,
    status          text        NOT NULL DEFAULT 'issued',
    pdf_url         text,
    issued_at       timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tickets IS 'One row per admit-one ticket — the artifact that is QR-coded, emailed, and scanned at the gate.';
COMMENT ON COLUMN public.tickets.event_id IS 'Denormalized from ticket_tier_id/order_id chain so the scanner avoids a multi-table join under gate-rush latency.';
COMMENT ON COLUMN public.tickets.tenant_id IS 'Denormalized for a flat RLS check on the highest-traffic table in the system.';
COMMENT ON COLUMN public.tickets.qr_signature IS 'HMAC signature over the ticket payload, computed at issuance time, preventing forged/edited ticket IDs.';

-- -----------------------------------------------------------------------------
-- 2.7 payments — depends on orders, tenants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
    order_id              uuid        NOT NULL,
    tenant_id             uuid        NOT NULL,
    provider              text        NOT NULL,
    provider_payment_id   text,
    provider_order_id     text,
    amount_minor          integer     NOT NULL,
    currency              text        NOT NULL,
    status                text        NOT NULL DEFAULT 'initiated',
    raw_webhook_payload   jsonb,
    failure_reason        text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Financial ledger of every payment attempt against an order. One order may have several attempts (failed retry, or a Razorpay attempt followed by a manual UPI fallback).';
COMMENT ON COLUMN public.payments.provider_payment_id IS 'Razorpay''s payment ID — also the de-dupe key for webhook idempotency.';
COMMENT ON COLUMN public.payments.raw_webhook_payload IS 'Full webhook body retained for audit trail and payment dispute resolution.';

-- -----------------------------------------------------------------------------
-- 2.8 verification_queue — depends on orders, payments, tenants, users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_queue (
    id                     uuid        NOT NULL DEFAULT gen_random_uuid(),
    order_id               uuid        NOT NULL,
    payment_id             uuid        NOT NULL,
    tenant_id              uuid        NOT NULL,
    utr_reference          text        NOT NULL,
    proof_screenshot_url   text,
    submitted_at           timestamptz NOT NULL DEFAULT now(),
    status                 text        NOT NULL DEFAULT 'pending',
    reviewed_by            uuid,
    reviewed_at            timestamptz,
    rejection_reason       text,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.verification_queue IS 'Manual UPI review workflow, intentionally separate from payments so the human-review process (queue, SLA, audit) does not distort the financial ledger''s shape.';
COMMENT ON COLUMN public.verification_queue.utr_reference IS 'Buyer-submitted UPI transaction reference, manually cross-checked by staff against the organizer''s bank statement.';
COMMENT ON COLUMN public.verification_queue.reviewed_by IS 'Staff member who approved/rejected — accountability trail.';

-- -----------------------------------------------------------------------------
-- 2.9 check_ins — depends on tickets, events, tenants, users
--     Append-only audit log: no updated_at, rows are never updated.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.check_ins (
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    ticket_id       uuid        NOT NULL,
    event_id        uuid        NOT NULL,
    tenant_id       uuid        NOT NULL,
    checked_in_by   uuid        NOT NULL,
    status          text        NOT NULL,
    gate_name       text,
    device_info     text,
    scanned_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.check_ins IS 'Append-only audit log of every gate-scan attempt (success, duplicate, invalid). Rows are never updated, so this table intentionally has no updated_at column or trigger.';
COMMENT ON COLUMN public.check_ins.status IS 'success | duplicate | invalid — logging non-success attempts too is what makes ticket-sharing/fraud detection possible.';

-- -----------------------------------------------------------------------------
-- 2.10 jobs — depends on tenants (nullable)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    tenant_id      uuid,
    type           text        NOT NULL,
    payload        jsonb       NOT NULL,
    status         text        NOT NULL DEFAULT 'queued',
    attempts       integer     NOT NULL DEFAULT 0,
    max_attempts   integer     NOT NULL DEFAULT 5,
    last_error     text,
    run_after      timestamptz NOT NULL DEFAULT now(),
    locked_at      timestamptz,
    locked_by      text,
    completed_at   timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.jobs IS 'Generic background job queue (PDF generation, email sending, webhook retries) for slow work that must run outside the request/response cycle on a serverless host.';
COMMENT ON COLUMN public.jobs.payload IS 'Job-specific data. Generic (type + payload) shape avoids a new table per job type.';
COMMENT ON COLUMN public.jobs.locked_at IS 'Claimed-by-worker marker. Workers should claim rows via SELECT ... FOR UPDATE SKIP LOCKED to avoid double-processing.';


-- =============================================================================
-- 3. CONSTRAINTS (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE — by name)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 tenants
-- -----------------------------------------------------------------------------
ALTER TABLE public.tenants
    ADD CONSTRAINT pk_tenants PRIMARY KEY (id);

ALTER TABLE public.tenants
    ADD CONSTRAINT uq_tenants_slug UNIQUE (slug);

ALTER TABLE public.tenants
    ADD CONSTRAINT chk_tenants_slug_format
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

ALTER TABLE public.tenants
    ADD CONSTRAINT chk_tenants_plan_tier
        CHECK (plan_tier IN ('free', 'pro', 'enterprise'));

ALTER TABLE public.tenants
    ADD CONSTRAINT chk_tenants_status
        CHECK (status IN ('active', 'trial', 'suspended'));

-- -----------------------------------------------------------------------------
-- 3.2 users
-- -----------------------------------------------------------------------------
ALTER TABLE public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);

ALTER TABLE public.users
    ADD CONSTRAINT fk_users_auth_user
        FOREIGN KEY (id) REFERENCES auth.users (id)
        ON DELETE CASCADE;

ALTER TABLE public.users
    ADD CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE CASCADE;

ALTER TABLE public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);

ALTER TABLE public.users
    ADD CONSTRAINT chk_users_role
        CHECK (role IN ('super_admin', 'owner', 'staff'));

ALTER TABLE public.users
    ADD CONSTRAINT chk_users_role_tenant_consistency
        CHECK (
            (role = 'super_admin' AND tenant_id IS NULL)
            OR (role IN ('owner', 'staff') AND tenant_id IS NOT NULL)
        );

-- -----------------------------------------------------------------------------
-- 3.3 events
-- -----------------------------------------------------------------------------
ALTER TABLE public.events
    ADD CONSTRAINT pk_events PRIMARY KEY (id);

ALTER TABLE public.events
    ADD CONSTRAINT fk_events_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE CASCADE;

ALTER TABLE public.events
    ADD CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id) REFERENCES public.users (id)
        ON DELETE RESTRICT;

ALTER TABLE public.events
    ADD CONSTRAINT uq_events_tenant_slug UNIQUE (tenant_id, slug);

ALTER TABLE public.events
    ADD CONSTRAINT chk_events_status
        CHECK (status IN ('draft', 'published', 'cancelled', 'completed'));

ALTER TABLE public.events
    ADD CONSTRAINT chk_events_visibility
        CHECK (visibility IN ('public', 'unlisted', 'private'));

ALTER TABLE public.events
    ADD CONSTRAINT chk_events_date_order
        CHECK (end_at > start_at);

ALTER TABLE public.events
    ADD CONSTRAINT chk_events_max_capacity_nonneg
        CHECK (max_capacity IS NULL OR max_capacity >= 0);

-- -----------------------------------------------------------------------------
-- 3.4 ticket_tiers
-- -----------------------------------------------------------------------------
ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT pk_ticket_tiers PRIMARY KEY (id);

ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT fk_ticket_tiers_event
        FOREIGN KEY (event_id) REFERENCES public.events (id)
        ON DELETE CASCADE;

ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT chk_ticket_tiers_price_nonneg
        CHECK (price_minor >= 0);

ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT chk_ticket_tiers_quantity_total_nonneg
        CHECK (quantity_total >= 0);

ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT chk_ticket_tiers_quantity_sold_within_total
        CHECK (quantity_sold >= 0 AND quantity_sold <= quantity_total);

ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT chk_ticket_tiers_sale_window_order
        CHECK (
            sale_start_at IS NULL
            OR sale_end_at IS NULL
            OR sale_end_at > sale_start_at
        );

-- -----------------------------------------------------------------------------
-- 3.5 orders
-- -----------------------------------------------------------------------------
ALTER TABLE public.orders
    ADD CONSTRAINT pk_orders PRIMARY KEY (id);

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE CASCADE;

ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_event
        FOREIGN KEY (event_id) REFERENCES public.events (id)
        ON DELETE RESTRICT;

ALTER TABLE public.orders
    ADD CONSTRAINT uq_orders_idempotency_key UNIQUE (idempotency_key);

ALTER TABLE public.orders
    ADD CONSTRAINT chk_orders_status
        CHECK (status IN ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded', 'cancelled'));

ALTER TABLE public.orders
    ADD CONSTRAINT chk_orders_payment_method
        CHECK (payment_method IS NULL OR payment_method IN ('razorpay', 'manual_upi'));

ALTER TABLE public.orders
    ADD CONSTRAINT chk_orders_total_amount_nonneg
        CHECK (total_amount_minor >= 0);

-- -----------------------------------------------------------------------------
-- 3.6 tickets
-- -----------------------------------------------------------------------------
ALTER TABLE public.tickets
    ADD CONSTRAINT pk_tickets PRIMARY KEY (id);

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_order
        FOREIGN KEY (order_id) REFERENCES public.orders (id)
        ON DELETE CASCADE;

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_ticket_tier
        FOREIGN KEY (ticket_tier_id) REFERENCES public.ticket_tiers (id)
        ON DELETE RESTRICT;

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_event
        FOREIGN KEY (event_id) REFERENCES public.events (id)
        ON DELETE RESTRICT;

ALTER TABLE public.tickets
    ADD CONSTRAINT fk_tickets_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE RESTRICT;

ALTER TABLE public.tickets
    ADD CONSTRAINT uq_tickets_ticket_code UNIQUE (ticket_code);

ALTER TABLE public.tickets
    ADD CONSTRAINT chk_tickets_status
        CHECK (status IN ('issued', 'checked_in', 'void', 'refunded'));

-- -----------------------------------------------------------------------------
-- 3.7 payments
-- -----------------------------------------------------------------------------
ALTER TABLE public.payments
    ADD CONSTRAINT pk_payments PRIMARY KEY (id);

ALTER TABLE public.payments
    ADD CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES public.orders (id)
        ON DELETE CASCADE;

ALTER TABLE public.payments
    ADD CONSTRAINT fk_payments_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE RESTRICT;

ALTER TABLE public.payments
    ADD CONSTRAINT uq_payments_provider_payment_id UNIQUE (provider_payment_id);

ALTER TABLE public.payments
    ADD CONSTRAINT chk_payments_provider
        CHECK (provider IN ('razorpay', 'manual_upi'));

ALTER TABLE public.payments
    ADD CONSTRAINT chk_payments_status
        CHECK (status IN ('initiated', 'captured', 'failed', 'refunded'));

ALTER TABLE public.payments
    ADD CONSTRAINT chk_payments_amount_nonneg
        CHECK (amount_minor >= 0);

-- -----------------------------------------------------------------------------
-- 3.8 verification_queue
-- -----------------------------------------------------------------------------
ALTER TABLE public.verification_queue
    ADD CONSTRAINT pk_verification_queue PRIMARY KEY (id);

ALTER TABLE public.verification_queue
    ADD CONSTRAINT fk_verification_queue_order
        FOREIGN KEY (order_id) REFERENCES public.orders (id)
        ON DELETE CASCADE;

ALTER TABLE public.verification_queue
    ADD CONSTRAINT fk_verification_queue_payment
        FOREIGN KEY (payment_id) REFERENCES public.payments (id)
        ON DELETE CASCADE;

ALTER TABLE public.verification_queue
    ADD CONSTRAINT fk_verification_queue_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE RESTRICT;

ALTER TABLE public.verification_queue
    ADD CONSTRAINT fk_verification_queue_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES public.users (id)
        ON DELETE SET NULL;

ALTER TABLE public.verification_queue
    ADD CONSTRAINT uq_verification_queue_payment_id UNIQUE (payment_id);

ALTER TABLE public.verification_queue
    ADD CONSTRAINT chk_verification_queue_status
        CHECK (status IN ('pending', 'approved', 'rejected'));

-- -----------------------------------------------------------------------------
-- 3.9 check_ins
-- -----------------------------------------------------------------------------
ALTER TABLE public.check_ins
    ADD CONSTRAINT pk_check_ins PRIMARY KEY (id);

ALTER TABLE public.check_ins
    ADD CONSTRAINT fk_check_ins_ticket
        FOREIGN KEY (ticket_id) REFERENCES public.tickets (id)
        ON DELETE CASCADE;

ALTER TABLE public.check_ins
    ADD CONSTRAINT fk_check_ins_event
        FOREIGN KEY (event_id) REFERENCES public.events (id)
        ON DELETE RESTRICT;

ALTER TABLE public.check_ins
    ADD CONSTRAINT fk_check_ins_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE RESTRICT;

ALTER TABLE public.check_ins
    ADD CONSTRAINT fk_check_ins_checked_in_by
        FOREIGN KEY (checked_in_by) REFERENCES public.users (id)
        ON DELETE RESTRICT;

ALTER TABLE public.check_ins
    ADD CONSTRAINT chk_check_ins_status
        CHECK (status IN ('success', 'duplicate', 'invalid'));

-- -----------------------------------------------------------------------------
-- 3.10 jobs
-- -----------------------------------------------------------------------------
ALTER TABLE public.jobs
    ADD CONSTRAINT pk_jobs PRIMARY KEY (id);

ALTER TABLE public.jobs
    ADD CONSTRAINT fk_jobs_tenant
        FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
        ON DELETE SET NULL;

ALTER TABLE public.jobs
    ADD CONSTRAINT chk_jobs_status
        CHECK (status IN ('queued', 'processing', 'completed', 'failed'));


-- =============================================================================
-- 4. INDEXES
-- =============================================================================

-- 4.1 tenants
-- Partial unique index: enforces uniqueness only where a custom domain is
-- actually set, demonstrating the documented "unique partial index" design
-- for custom_domain (a plain UNIQUE constraint would behave equivalently
-- since SQL UNIQUE already treats multiple NULLs as distinct, but this is
-- written explicitly as a partial index per the approved design notes).
CREATE UNIQUE INDEX IF NOT EXISTS ux_tenants_custom_domain
    ON public.tenants (custom_domain)
    WHERE custom_domain IS NOT NULL;

-- 4.2 users
CREATE INDEX IF NOT EXISTS idx_users_tenant_id
    ON public.users (tenant_id);

-- 4.3 events
CREATE INDEX IF NOT EXISTS idx_events_tenant_status_start
    ON public.events (tenant_id, status, start_at);

CREATE INDEX IF NOT EXISTS idx_events_start_at
    ON public.events (start_at);

-- 4.4 ticket_tiers
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id
    ON public.ticket_tiers (event_id);

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_active
    ON public.ticket_tiers (event_id, is_active);

-- 4.5 orders
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status
    ON public.orders (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_event_id
    ON public.orders (event_id);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_email
    ON public.orders (buyer_email);

-- 4.6 tickets
CREATE INDEX IF NOT EXISTS idx_tickets_qr_signature
    ON public.tickets (qr_signature);

CREATE INDEX IF NOT EXISTS idx_tickets_event_status
    ON public.tickets (event_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_order_id
    ON public.tickets (order_id);

-- 4.7 payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id
    ON public.payments (order_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_status
    ON public.payments (provider, status);

-- 4.8 verification_queue
CREATE INDEX IF NOT EXISTS idx_verification_queue_tenant_status
    ON public.verification_queue (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_verification_queue_order_id
    ON public.verification_queue (order_id);

-- 4.9 check_ins
CREATE INDEX IF NOT EXISTS idx_check_ins_ticket_id
    ON public.check_ins (ticket_id);

CREATE INDEX IF NOT EXISTS idx_check_ins_event_scanned_at
    ON public.check_ins (event_id, scanned_at);

CREATE INDEX IF NOT EXISTS idx_check_ins_event_status
    ON public.check_ins (event_id, status);

-- 4.10 jobs
-- Composite index matches the exact dequeue query shape:
--   WHERE status = 'queued' AND run_after <= now() ORDER BY run_after
CREATE INDEX IF NOT EXISTS idx_jobs_status_run_after
    ON public.jobs (status, run_after);

CREATE INDEX IF NOT EXISTS idx_jobs_type
    ON public.jobs (type);


-- =============================================================================
-- 5. TRIGGER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
    'Generic BEFORE UPDATE trigger function: stamps updated_at = now() on every row update. Attached to every table that has an updated_at column except check_ins, which is append-only and never updated.';


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS trg_tenants_set_updated_at ON public.tenants;
CREATE TRIGGER trg_tenants_set_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_events_set_updated_at ON public.events;
CREATE TRIGGER trg_events_set_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ticket_tiers_set_updated_at ON public.ticket_tiers;
CREATE TRIGGER trg_ticket_tiers_set_updated_at
    BEFORE UPDATE ON public.ticket_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON public.orders;
CREATE TRIGGER trg_orders_set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tickets_set_updated_at ON public.tickets;
CREATE TRIGGER trg_tickets_set_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_set_updated_at ON public.payments;
CREATE TRIGGER trg_payments_set_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_verification_queue_set_updated_at ON public.verification_queue;
CREATE TRIGGER trg_verification_queue_set_updated_at
    BEFORE UPDATE ON public.verification_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_set_updated_at ON public.jobs;
CREATE TRIGGER trg_jobs_set_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- NOTE: check_ins intentionally has NO updated_at trigger — it is an
-- append-only audit log (see comment on the table in Section 2.9).