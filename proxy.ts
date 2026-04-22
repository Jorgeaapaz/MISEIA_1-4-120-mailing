import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/verify', '/api/auth/magic-link', '/api/auth/verify']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Para rutas de API protegidas, la validación del JWT se hace dentro de cada route handler.
  // Para rutas de UI del dashboard, dejamos pasar — el cliente redirige si no hay token.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
