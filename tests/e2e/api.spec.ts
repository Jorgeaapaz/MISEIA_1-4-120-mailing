import { test, expect } from '@playwright/test'

test.describe('API routes — unauthenticated', () => {
  test('GET /api/clientes returns 401 without token', async ({ request }) => {
    const res = await request.get('/api/clientes')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/plantillas returns 401 without token', async ({ request }) => {
    const res = await request.get('/api/plantillas')
    expect(res.status()).toBe(401)
  })

  test('GET /api/campanas returns 401 without token', async ({ request }) => {
    const res = await request.get('/api/campanas')
    expect(res.status()).toBe(401)
  })

  test('POST /api/auth/magic-link with missing email returns 400', async ({ request }) => {
    const res = await request.post('/api/auth/magic-link', {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/magic-link with valid email returns 200', async ({ request }) => {
    const res = await request.post('/api/auth/magic-link', {
      data: { email: 'e2e-test@example.com' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('message')
  })
})
