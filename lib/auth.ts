import jwt from 'jsonwebtoken'
import type { JwtPayload } from './types'

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('Missing JWT_SECRET env variable')
  return s
}

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload
  } catch {
    return null
  }
}

export function extractJwtFromHeader(authHeader: string | null): JwtPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return verifyJwt(authHeader.slice(7))
}
