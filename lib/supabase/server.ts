import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

/**
 * Creates a Supabase client for use on the server — in Server Components,
 * Server Actions, and Route Handlers.
 *
 * Must be called fresh on every request (do not cache/reuse across requests),
 * since it reads the current request's cookies via `next/headers`.
 *
 * Uses the `getAll` / `setAll` cookie interface, which is the only
 * non-deprecated pattern supported by the current `@supabase/ssr` package.
 * The individual `get` / `set` / `remove` methods are deprecated and must
 * not be used.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` was called from a Server Component, where cookies
            // cannot be written. This is safe to ignore as long as you
            // have proxy/middleware in place to refresh user sessions.
          }
        },
      },
    }
  )
}