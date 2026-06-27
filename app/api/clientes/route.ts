export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import type { Cliente } from '@/lib/types'

export async function GET(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const db = await getDb()
  const { searchParams } = req.nextUrl
  const tag = searchParams.get('tag')
  const search = searchParams.get('search')

  const filter: Record<string, unknown> = { tenantId: payload.tenantId, active: true }
  if (tag) filter.tags = tag
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ]

  const clientes = await db.collection<Cliente>('clientes').find(filter).sort({ createdAt: -1 }).toArray()
  return Response.json(clientes)
}

export async function POST(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  if (!body.name || !body.email) {
    return Response.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
  }

  const db = await getDb()

  const existing = await db.collection('clientes').findOne({
    tenantId: payload.tenantId,
    email: body.email.toLowerCase(),
    active: true,
  })
  if (existing) return Response.json({ error: 'Ya existe un cliente con ese email' }, { status: 409 })

  const cliente: Cliente = {
    tenantId: payload.tenantId,
    name: body.name,
    email: body.email.toLowerCase(),
    tags: Array.isArray(body.tags) ? body.tags : [],
    metadata: typeof body.metadata === 'object' ? body.metadata : {},
    active: true,
    createdAt: new Date(),
  }

  const result = await db.collection('clientes').insertOne(cliente)
  return Response.json({ ...cliente, _id: result.insertedId }, { status: 201 })
}
