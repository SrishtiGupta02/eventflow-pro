-- 0003_signup_provisioning.sql
--
-- Adds ONE function. No existing table, column, or RLS policy is changed.
--
-- Why this exists: under the current RLS policies, inserting into `tenants`
-- is super_admin-only, and inserting into `users` requires the caller to
-- already be `owner` of a matching tenant. A brand-new signup can satisfy
-- neither on their own (there is no tenant yet, and their JWT carries no
-- tenant/role claim yet) — so the application's own `users` insert call
-- will be rejected by RLS unless this gap is closed.
--
-- This SECURITY DEFINER function is the sanctioned way to perform that
-- one-time "create my own organization + owner profile" step without
-- reaching for the service_role key. It only acts on behalf of whichever
-- user calls it (via auth.uid()) and only succeeds once per user.
--
-- Run this against your Supabase project (SQL editor or `supabase db push`).
-- It is not executed automatically by the application.

CREATE OR REPLACE FUNCTION public.provision_tenant_and_owner(
    p_org_name text,
    p_full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_base_slug text;
    v_slug text;
    v_tenant_id uuid;
    v_suffix text;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'must be called by an authenticated user';
    END IF;

    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
        RAISE EXCEPTION 'a profile already exists for this account';
    END IF;

    IF p_org_name IS NULL OR length(trim(p_org_name)) = 0 THEN
        RAISE EXCEPTION 'organization name is required';
    END IF;

    v_base_slug := lower(regexp_replace(trim(p_org_name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_base_slug := regexp_replace(v_base_slug, '(^-+|-+$)', '', 'g');
    IF v_base_slug = '' THEN
        v_base_slug := 'org';
    END IF;

    v_slug := v_base_slug;

    -- Resolve slug collisions deterministically, without revealing how many
    -- other tenants share the prefix.
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) LOOP
        v_suffix := substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
        v_slug := v_base_slug || '-' || v_suffix;
    END LOOP;

    INSERT INTO public.tenants (name, slug)
    VALUES (trim(p_org_name), v_slug)
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.users (id, tenant_id, email, full_name, role)
    VALUES (
        v_uid,
        v_tenant_id,
        (SELECT email FROM auth.users WHERE id = v_uid),
        p_full_name,
        'owner'
    );

    RETURN v_tenant_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.provision_tenant_and_owner(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_tenant_and_owner(text, text) TO authenticated;