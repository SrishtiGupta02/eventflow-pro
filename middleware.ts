import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard']
const publicAuthRoutes = ['/login', '/signup', '/forgot-password']

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isPublicAuthRoute(pathname: string) {
  return publicAuthRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Middleware only reads auth state.
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  const user = data.user
  const pathname = url.pathname

  if (isProtectedRoute(pathname) && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isPublicAuthRoute(pathname) && user) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup', '/forgot-password'],
}
