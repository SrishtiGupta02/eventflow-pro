import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for use in the browser (Client Components).
 *
 * This client is safe to call on every render — `createBrowserClient`
 * is lightweight and internally reuses the underlying connection.
 * Call this inside the component/hook that needs it; do not cache
 * the result in a module-level singleton, since that can leak state
 * across users in some rendering environments.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}