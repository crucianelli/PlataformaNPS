import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Extrae el project ref de la URL para identificar los chunks de cookies de Supabase
// ej: "https://pkjnkmjunpmnzjtpyzyk.supabase.co" → "pkjnkmjunpmnzjtpyzyk"
const SUPABASE_PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL!
  .replace('https://', '')
  .split('.')[0]
const STALE_CHUNK_RE = new RegExp(`^sb-${SUPABASE_PROJECT_REF}-auth-token\\.\\d+$`)

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Registra qué cookies escribe Supabase en este ciclo para detectar chunks obsoletos
  const freshCookieNames = new Set<string>()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            freshCookieNames.add(name)
          })
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Elimina chunks de auth viejos que ya no forman parte de la sesión actual.
  // Esto previene el error HTTP 431 (Request Header Fields Too Large) cuando
  // se acumulan chunks obsoletos en el browser del usuario.
  for (const cookie of request.cookies.getAll()) {
    if (STALE_CHUNK_RE.test(cookie.name) && !freshCookieNames.has(cookie.name)) {
      supabaseResponse.cookies.delete(cookie.name)
    }
  }
  const role = user?.app_metadata?.role as string | undefined

  const { pathname } = request.nextUrl
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/encuesta') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/nueva-password')

  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Usuarios Rambla: solo pueden acceder a /rambla
  if (user && role === 'rambla' && !pathname.startsWith('/rambla')) {
    return NextResponse.redirect(new URL('/rambla', request.url))
  }

  // Usuarios Fábrica: solo pueden acceder a las rutas de visualización (Principal)
  const FABRICA_ALLOWED = ['/', '/nps', '/respuestas']
  if (user && role === 'fabrica') {
    const allowed = FABRICA_ALLOWED.some((r) =>
      r === '/' ? pathname === '/' : pathname.startsWith(r)
    )
    if (!allowed) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname === '/login' && user) {
    const dest = role === 'rambla' ? '/rambla' : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:jpg|jpeg|png|gif|webp|svg|ico)$).*)'],
}
