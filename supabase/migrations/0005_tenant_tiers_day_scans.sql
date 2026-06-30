-- 0005_tenant_tiers_day_scans.sql
--
-- Align ticket_tiers with the product contract that every core table carries
-- tenant_id directly, and add day-aware ticket validity for multi-day events.

ALTER TABLE public.ticket_tiers
    ADD COLUMN IF NOT EXISTS tenant_id uuid;

UPDATE public.ticket_tiers tt
SET tenant_id = e.tenant_id
FROM public.events e
WHERE tt.event_id = e.id
  AND tt.tenant_id IS NULL;

ALTER TABLE public.ticket_tiers
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.ticket_tiers
    DROP CONSTRAINT IF EXISTS fk_ticket_tiers_tenant;

ALTER TABLE public.ticket_tiers
    ADD CONSTRAINT fk_ticket_tiers_tenant
    FOREIGN KEY (tenant_id) REFERENCES public.tenants (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_tenant_event
    ON public.ticket_tiers (tenant_id, event_id);

ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS event_dates date[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.events.event_dates IS 'Calendar dates on which the event admits attendees. Used by scanner UI for day-aware validation.';

ALTER TABLE public.ticket_tiers
    ADD COLUMN IF NOT EXISTS valid_event_dates date[];

COMMENT ON COLUMN public.ticket_tiers.valid_event_dates IS 'Optional subset of event_dates this tier can scan on. NULL means all event days.';

ALTER TABLE public.tickets
    ADD COLUMN IF NOT EXISTS valid_event_dates date[];

COMMENT ON COLUMN public.tickets.valid_event_dates IS 'Copied from the tier at issuance time. NULL means all event days.';

ALTER TABLE public.check_ins
    ADD COLUMN IF NOT EXISTS scan_date date;

COMMENT ON COLUMN public.check_ins.scan_date IS 'Event date selected by gate staff for day-aware admission checks.';

CREATE OR REPLACE FUNCTION public.create_order_with_ticket_reservation(
    p_ticket_tier_id uuid,
    p_quantity integer,
    p_buyer_name text,
    p_buyer_email text,
    p_total_amount_minor integer,
    p_currency text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket_tier RECORD;
    v_event RECORD;
    v_tenant_id uuid;
    v_order_id uuid;
BEGIN
    IF p_quantity < 1 THEN
        RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;

    SELECT id, event_id, tenant_id, price_minor, currency, quantity_total, quantity_sold, valid_event_dates
    INTO v_ticket_tier
    FROM public.ticket_tiers
    WHERE id = p_ticket_tier_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ticket tier not found';
    END IF;

    IF v_ticket_tier.currency <> p_currency THEN
        RAISE EXCEPTION 'Currency mismatch';
    END IF;

    IF v_ticket_tier.quantity_sold + p_quantity > v_ticket_tier.quantity_total THEN
        RAISE EXCEPTION 'Not enough tickets available';
    END IF;

    SELECT id, tenant_id
    INTO v_event
    FROM public.events
    WHERE id = v_ticket_tier.event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    v_tenant_id := v_event.tenant_id;

    IF v_ticket_tier.tenant_id <> v_tenant_id THEN
        RAISE EXCEPTION 'Ticket tier tenant mismatch';
    END IF;

    INSERT INTO public.orders (
        tenant_id,
        event_id,
        buyer_name,
        buyer_email,
        total_amount_minor,
        currency,
        status
    ) VALUES (
        v_tenant_id,
        v_ticket_tier.event_id,
        p_buyer_name,
        p_buyer_email,
        p_total_amount_minor,
        p_currency,
        'pending'
    )
    RETURNING id INTO v_order_id;

    UPDATE public.ticket_tiers
    SET quantity_sold = quantity_sold + p_quantity
    WHERE id = p_ticket_tier_id;

    INSERT INTO public.tickets (
        order_id,
        ticket_tier_id,
        event_id,
        tenant_id,
        holder_name,
        holder_email,
        ticket_code,
        qr_signature,
        valid_event_dates,
        status,
        issued_at
    )
    SELECT
        v_order_id,
        p_ticket_tier_id,
        v_ticket_tier.event_id,
        v_tenant_id,
        p_buyer_name,
        p_buyer_email,
        concat('TCKT-', substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
        md5(gen_random_uuid()::text),
        v_ticket_tier.valid_event_dates,
        'issued',
        now()
    FROM generate_series(1, p_quantity);

    RETURN v_order_id;
END;
$$;
