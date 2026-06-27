-- =============================================================================
-- 002_rls.sql — EventFlow Pro Row Level Security
-- Builds on 0001_eventflow_pro_initial_schema.sql. No tables, columns, or
-- relationships are modified. JWT contract assumed: auth.uid(), tenant_id,
-- role (role in: 'super_admin' | 'owner' | 'organizer' | 'staff').
-- =============================================================================


-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.jwt_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
    SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT auth.jwt() ->> 'role';
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT public.jwt_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT public.jwt_role() = 'owner';
$$;

CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT public.jwt_role() = 'organizer';
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT public.jwt_role() = 'staff';
$$;

CREATE OR REPLACE FUNCTION public.is_owner_or_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
    SELECT public.jwt_role() IN ('owner', 'staff');
$$;

-- Row-dependent helpers (take a per-row argument). SECURITY DEFINER so they
-- evaluate consistently regardless of the caller's own RLS visibility into
-- events/orders, with a locked search_path to prevent hijacking.

CREATE OR REPLACE FUNCTION public.event_tenant_id(p_event_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT tenant_id FROM public.events WHERE id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION public.organizes_event(p_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.events e
        WHERE e.id = p_event_id
          AND e.organizer_id = (SELECT auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.organizes_order(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.events e ON e.id = o.event_id
        WHERE o.id = p_order_id
          AND e.organizer_id = (SELECT auth.uid())
    );
$$;

-- Supports the event_tenant_id() lookup used by ticket_tiers policies.
CREATE INDEX IF NOT EXISTS idx_events_organizer_id
    ON public.events (organizer_id);


-- =============================================================================
-- TENANTS
-- =============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_select_super_admin" ON public.tenants;
CREATE POLICY "tenants_select_super_admin" ON public.tenants
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tenants_select_own" ON public.tenants;
CREATE POLICY "tenants_select_own" ON public.tenants
    FOR SELECT TO authenticated
    USING (id = (SELECT public.jwt_tenant_id()));

DROP POLICY IF EXISTS "tenants_insert_super_admin" ON public.tenants;
CREATE POLICY "tenants_insert_super_admin" ON public.tenants
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tenants_update_super_admin" ON public.tenants;
CREATE POLICY "tenants_update_super_admin" ON public.tenants
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tenants_update_owner_own" ON public.tenants;
CREATE POLICY "tenants_update_owner_own" ON public.tenants
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_owner()) AND id = (SELECT public.jwt_tenant_id()))
    WITH CHECK ((SELECT public.is_owner()) AND id = (SELECT public.jwt_tenant_id()));

DROP POLICY IF EXISTS "tenants_delete_super_admin" ON public.tenants;
CREATE POLICY "tenants_delete_super_admin" ON public.tenants
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));


-- =============================================================================
-- USERS
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_super_admin" ON public.users;
CREATE POLICY "users_select_super_admin" ON public.users
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "users_select_tenant_owner_staff" ON public.users;
CREATE POLICY "users_select_tenant_owner_staff" ON public.users
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self" ON public.users
    FOR SELECT TO authenticated
    USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "users_insert_super_admin" ON public.users;
CREATE POLICY "users_insert_super_admin" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "users_insert_owner_own_tenant" ON public.users;
CREATE POLICY "users_insert_owner_own_tenant" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "users_update_super_admin" ON public.users;
CREATE POLICY "users_update_super_admin" ON public.users
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "users_update_owner_own_tenant" ON public.users;
CREATE POLICY "users_update_owner_own_tenant" ON public.users
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "users_delete_super_admin" ON public.users;
CREATE POLICY "users_delete_super_admin" ON public.users
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "users_delete_owner_own_tenant" ON public.users;
CREATE POLICY "users_delete_owner_own_tenant" ON public.users
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );


-- =============================================================================
-- EVENTS
-- =============================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_super_admin" ON public.events;
CREATE POLICY "events_select_super_admin" ON public.events
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "events_select_tenant_owner_staff" ON public.events;
CREATE POLICY "events_select_tenant_owner_staff" ON public.events
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "events_select_organizer_own" ON public.events;
CREATE POLICY "events_select_organizer_own" ON public.events
    FOR SELECT TO authenticated
    USING (organizer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "events_insert_super_admin" ON public.events;
CREATE POLICY "events_insert_super_admin" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "events_insert_owner_own_tenant" ON public.events;
CREATE POLICY "events_insert_owner_own_tenant" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "events_insert_organizer_self" ON public.events;
CREATE POLICY "events_insert_organizer_self" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_organizer())
        AND tenant_id = (SELECT public.jwt_tenant_id())
        AND organizer_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "events_update_super_admin" ON public.events;
CREATE POLICY "events_update_super_admin" ON public.events
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "events_update_owner_own_tenant" ON public.events;
CREATE POLICY "events_update_owner_own_tenant" ON public.events
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "events_update_organizer_own" ON public.events;
CREATE POLICY "events_update_organizer_own" ON public.events
    FOR UPDATE TO authenticated
    USING (organizer_id = (SELECT auth.uid()))
    WITH CHECK (
        organizer_id = (SELECT auth.uid())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "events_delete_super_admin" ON public.events;
CREATE POLICY "events_delete_super_admin" ON public.events
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "events_delete_owner_own_tenant" ON public.events;
CREATE POLICY "events_delete_owner_own_tenant" ON public.events
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "events_delete_organizer_own" ON public.events;
CREATE POLICY "events_delete_organizer_own" ON public.events
    FOR DELETE TO authenticated
    USING (organizer_id = (SELECT auth.uid()));


-- =============================================================================
-- TICKET_TIERS (no direct tenant_id — tenant/organizer resolved via event_id)
-- =============================================================================
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ticket_tiers_select_super_admin" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_select_super_admin" ON public.ticket_tiers
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "ticket_tiers_select_tenant_owner_staff" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_select_tenant_owner_staff" ON public.ticket_tiers
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND public.event_tenant_id(event_id) = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "ticket_tiers_select_organizer_own" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_select_organizer_own" ON public.ticket_tiers
    FOR SELECT TO authenticated
    USING (public.organizes_event(event_id));

DROP POLICY IF EXISTS "ticket_tiers_insert_super_admin" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_insert_super_admin" ON public.ticket_tiers
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "ticket_tiers_insert_owner_own_tenant" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_insert_owner_own_tenant" ON public.ticket_tiers
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND public.event_tenant_id(event_id) = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "ticket_tiers_insert_organizer_own_event" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_insert_organizer_own_event" ON public.ticket_tiers
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_organizer())
        AND public.organizes_event(event_id)
    );

DROP POLICY IF EXISTS "ticket_tiers_update_super_admin" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_update_super_admin" ON public.ticket_tiers
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "ticket_tiers_update_owner_own_tenant" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_update_owner_own_tenant" ON public.ticket_tiers
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND public.event_tenant_id(event_id) = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND public.event_tenant_id(event_id) = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "ticket_tiers_update_organizer_own_event" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_update_organizer_own_event" ON public.ticket_tiers
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_organizer())
        AND public.organizes_event(event_id)
    )
    WITH CHECK (
        (SELECT public.is_organizer())
        AND public.organizes_event(event_id)
    );

DROP POLICY IF EXISTS "ticket_tiers_delete_super_admin" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_delete_super_admin" ON public.ticket_tiers
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "ticket_tiers_delete_owner_own_tenant" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_delete_owner_own_tenant" ON public.ticket_tiers
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND public.event_tenant_id(event_id) = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "ticket_tiers_delete_organizer_own_event" ON public.ticket_tiers;
CREATE POLICY "ticket_tiers_delete_organizer_own_event" ON public.ticket_tiers
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_organizer())
        AND public.organizes_event(event_id)
    );


-- =============================================================================
-- ORDERS
-- =============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_super_admin" ON public.orders;
CREATE POLICY "orders_select_super_admin" ON public.orders
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "orders_select_tenant_owner_staff" ON public.orders;
CREATE POLICY "orders_select_tenant_owner_staff" ON public.orders
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "orders_select_organizer_own_event" ON public.orders;
CREATE POLICY "orders_select_organizer_own_event" ON public.orders
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_organizer())
        AND public.organizes_event(event_id)
    );

DROP POLICY IF EXISTS "orders_insert_super_admin" ON public.orders;
CREATE POLICY "orders_insert_super_admin" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "orders_insert_owner_own_tenant" ON public.orders;
CREATE POLICY "orders_insert_owner_own_tenant" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "orders_update_super_admin" ON public.orders;
CREATE POLICY "orders_update_super_admin" ON public.orders
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "orders_update_owner_own_tenant" ON public.orders;
CREATE POLICY "orders_update_owner_own_tenant" ON public.orders
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "orders_delete_super_admin" ON public.orders;
CREATE POLICY "orders_delete_super_admin" ON public.orders
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "orders_delete_owner_own_tenant" ON public.orders;
CREATE POLICY "orders_delete_owner_own_tenant" ON public.orders
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );


-- =============================================================================
-- TICKETS
-- =============================================================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_super_admin" ON public.tickets;
CREATE POLICY "tickets_select_super_admin" ON public.tickets
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tickets_select_tenant_owner_staff" ON public.tickets;
CREATE POLICY "tickets_select_tenant_owner_staff" ON public.tickets
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "tickets_select_organizer_own_event" ON public.tickets;
CREATE POLICY "tickets_select_organizer_own_event" ON public.tickets
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_organizer())
        AND public.organizes_event(event_id)
    );

DROP POLICY IF EXISTS "tickets_insert_super_admin" ON public.tickets;
CREATE POLICY "tickets_insert_super_admin" ON public.tickets
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tickets_insert_owner_own_tenant" ON public.tickets;
CREATE POLICY "tickets_insert_owner_own_tenant" ON public.tickets
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "tickets_update_super_admin" ON public.tickets;
CREATE POLICY "tickets_update_super_admin" ON public.tickets
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tickets_update_owner_own_tenant" ON public.tickets;
CREATE POLICY "tickets_update_owner_own_tenant" ON public.tickets
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "tickets_delete_super_admin" ON public.tickets;
CREATE POLICY "tickets_delete_super_admin" ON public.tickets
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "tickets_delete_owner_own_tenant" ON public.tickets;
CREATE POLICY "tickets_delete_owner_own_tenant" ON public.tickets
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );


-- =============================================================================
-- PAYMENTS
-- =============================================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_super_admin" ON public.payments;
CREATE POLICY "payments_select_super_admin" ON public.payments
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "payments_select_tenant_owner_staff" ON public.payments;
CREATE POLICY "payments_select_tenant_owner_staff" ON public.payments
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "payments_insert_super_admin" ON public.payments;
CREATE POLICY "payments_insert_super_admin" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "payments_insert_owner_own_tenant" ON public.payments;
CREATE POLICY "payments_insert_owner_own_tenant" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "payments_update_super_admin" ON public.payments;
CREATE POLICY "payments_update_super_admin" ON public.payments
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "payments_update_owner_own_tenant" ON public.payments;
CREATE POLICY "payments_update_owner_own_tenant" ON public.payments
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "payments_delete_super_admin" ON public.payments;
CREATE POLICY "payments_delete_super_admin" ON public.payments
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "payments_delete_owner_own_tenant" ON public.payments;
CREATE POLICY "payments_delete_owner_own_tenant" ON public.payments
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );


-- =============================================================================
-- VERIFICATION_QUEUE
-- =============================================================================
ALTER TABLE public.verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_queue FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verification_queue_select_super_admin" ON public.verification_queue;
CREATE POLICY "verification_queue_select_super_admin" ON public.verification_queue
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "verification_queue_select_tenant_owner_staff" ON public.verification_queue;
CREATE POLICY "verification_queue_select_tenant_owner_staff" ON public.verification_queue
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "verification_queue_insert_super_admin" ON public.verification_queue;
CREATE POLICY "verification_queue_insert_super_admin" ON public.verification_queue
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "verification_queue_insert_owner_own_tenant" ON public.verification_queue;
CREATE POLICY "verification_queue_insert_owner_own_tenant" ON public.verification_queue
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "verification_queue_update_super_admin" ON public.verification_queue;
CREATE POLICY "verification_queue_update_super_admin" ON public.verification_queue
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "verification_queue_update_owner_own_tenant" ON public.verification_queue;
CREATE POLICY "verification_queue_update_owner_own_tenant" ON public.verification_queue
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "verification_queue_delete_super_admin" ON public.verification_queue;
CREATE POLICY "verification_queue_delete_super_admin" ON public.verification_queue
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "verification_queue_delete_owner_own_tenant" ON public.verification_queue;
CREATE POLICY "verification_queue_delete_owner_own_tenant" ON public.verification_queue
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );


-- =============================================================================
-- CHECK_INS (append-only audit log — no UPDATE policy for any role;
-- DELETE intentionally restricted to super_admin only, not owner, to
-- preserve audit-trail integrity)
-- =============================================================================
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "check_ins_select_super_admin" ON public.check_ins;
CREATE POLICY "check_ins_select_super_admin" ON public.check_ins
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "check_ins_select_tenant_owner_staff" ON public.check_ins;
CREATE POLICY "check_ins_select_tenant_owner_staff" ON public.check_ins
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "check_ins_insert_super_admin" ON public.check_ins;
CREATE POLICY "check_ins_insert_super_admin" ON public.check_ins
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "check_ins_insert_owner_own_tenant" ON public.check_ins;
CREATE POLICY "check_ins_insert_owner_own_tenant" ON public.check_ins
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "check_ins_insert_staff_own_tenant" ON public.check_ins;
CREATE POLICY "check_ins_insert_staff_own_tenant" ON public.check_ins
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
        AND checked_in_by = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "check_ins_delete_super_admin" ON public.check_ins;
CREATE POLICY "check_ins_delete_super_admin" ON public.check_ins
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));


-- =============================================================================
-- JOBS
-- =============================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_super_admin" ON public.jobs;
CREATE POLICY "jobs_select_super_admin" ON public.jobs
    FOR SELECT TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "jobs_select_tenant_owner_staff" ON public.jobs;
CREATE POLICY "jobs_select_tenant_owner_staff" ON public.jobs
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_owner_or_staff())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "jobs_insert_super_admin" ON public.jobs;
CREATE POLICY "jobs_insert_super_admin" ON public.jobs
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "jobs_insert_owner_own_tenant" ON public.jobs;
CREATE POLICY "jobs_insert_owner_own_tenant" ON public.jobs
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "jobs_update_super_admin" ON public.jobs;
CREATE POLICY "jobs_update_super_admin" ON public.jobs
    FOR UPDATE TO authenticated
    USING ((SELECT public.is_super_admin()))
    WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "jobs_update_owner_own_tenant" ON public.jobs;
CREATE POLICY "jobs_update_owner_own_tenant" ON public.jobs
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    )
    WITH CHECK (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );

DROP POLICY IF EXISTS "jobs_delete_super_admin" ON public.jobs;
CREATE POLICY "jobs_delete_super_admin" ON public.jobs
    FOR DELETE TO authenticated
    USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS "jobs_delete_owner_own_tenant" ON public.jobs;
CREATE POLICY "jobs_delete_owner_own_tenant" ON public.jobs
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_owner())
        AND tenant_id = (SELECT public.jwt_tenant_id())
    );