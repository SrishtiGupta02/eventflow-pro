-- 0004_order_checkout_transaction.sql
--
-- Adds a Supabase RPC function for atomic order creation and ticket reservation.
-- This function performs a safe inventory update together with order and ticket
-- inserts in a single transaction.

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

    SELECT id, event_id, price_minor, currency, quantity_total, quantity_sold
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
        'issued',
        now()
    FROM generate_series(1, p_quantity);

    RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order_with_ticket_reservation(uuid, integer, text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_ticket_reservation(uuid, integer, text, text, integer, text) TO authenticated;
