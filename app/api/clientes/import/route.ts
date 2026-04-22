import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import type { Cliente } from '@/lib/types'

export async function POST(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const text = await req.text()
  const lines = text.split('\n').filter(Boolean)
  const db = await getDb()

  let imported = 0
  let skipped = 0

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim())
    const [name, email, ...tagParts] = parts
    if (!name || !email || !email.includes('@')) { skipped++; continue }

    const exists = await db.collection('clientes').findOne({
      tenantId: payload.tenantId,
      email: email.toLowerCase(),
      active: true,
    })
    if (exists) { skipped++; continue }

    const cliente: Cliente = {
      tenantId: payload.tenantId,
      name,
      email: email.toLowerCase(),
      tags: tagParts,
      metadata: {},
      active: true,
      createdAt: new Date(),
    }
    await db.collection('clientes').insertOne(cliente)
    imported++
  }

  return Response.json({ imported, skipped })
}
