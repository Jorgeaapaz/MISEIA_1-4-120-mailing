import jwt from 'jsonwebtoken'
import type { JwtPayload } from './types'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) throw new Error('Missing JWT_SECRET env variable')

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function extractJwtFromHeader(authHeader: string | null): JwtPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return verifyJwt(authHeader.slice(7))
}
