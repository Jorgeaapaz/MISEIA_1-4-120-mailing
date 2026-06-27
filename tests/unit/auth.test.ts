import { describe, it, expect, beforeAll } from 'vitest'

// Set JWT_SECRET before importing auth module
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long'
})

describe('auth', () => {
  it('signJwt + verifyJwt round-trip', async () => {
    const { signJwt, verifyJwt } = await import('../../lib/auth')
    const payload = {
      tenantId: 'tenant-123',
      userId: 'user-456',
      email: 'test@example.com',
      role: 'admin' as const,
    }
    const token = signJwt(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = verifyJwt(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.tenantId).toBe('tenant-123')
    expect(decoded!.userId).toBe('user-456')
    expect(decoded!.email).toBe('test@example.com')
    expect(decoded!.role).toBe('admin')
  })

  it('verifyJwt returns null for invalid token', async () => {
    const { verifyJwt } = await import('../../lib/auth')
    expect(verifyJwt('invalid.token.here')).toBeNull()
  })

  it('verifyJwt returns null for tampered token', async () => {
    const { signJwt, verifyJwt } = await import('../../lib/auth')
    const token = signJwt({
      tenantId: 't1',
      userId: 'u1',
      email: 'a@b.com',
      role: 'member',
    })
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(verifyJwt(tampered)).toBeNull()
  })

  it('extractJwtFromHeader returns null without Bearer prefix', async () => {
    const { extractJwtFromHeader } = await import('../../lib/auth')
    expect(extractJwtFromHeader(null)).toBeNull()
    expect(extractJwtFromHeader('Basic sometoken')).toBeNull()
    expect(extractJwtFromHeader('')).toBeNull()
  })

  it('extractJwtFromHeader parses valid Bearer token', async () => {
    const { signJwt, extractJwtFromHeader } = await import('../../lib/auth')
    const payload = {
      tenantId: 'tenant-abc',
      userId: 'user-xyz',
      email: 'demo@test.com',
      role: 'member' as const,
    }
    const token = signJwt(payload)
    const result = extractJwtFromHeader(`Bearer ${token}`)
    expect(result).not.toBeNull()
    expect(result!.tenantId).toBe('tenant-abc')
  })
})
