export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/clientes/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const db = await getDb()
  const cliente = await db.collection('clientes').findOne({
    _id: new ObjectId(id),
    tenantId: payload.tenantId,
  })
  if (!cliente) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  return Response.json(cliente)
}

export async function PUT(_req: NextRequest, ctx: RouteContext<'/api/clientes/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()
  const db = await getDb()

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) update.name = body.name
  if (body.email !== undefined) update.email = body.email.toLowerCase()
  if (body.tags !== undefined) update.tags = body.tags
  if (body.metadata !== undefined) update.metadata = body.metadata

  const result = await db.collection('clientes').findOneAndUpdate(
    { _id: new ObjectId(id), tenantId: payload.tenantId },
    { $set: update },
    { returnDocument: 'after' }
  )
  if (!result) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  return Response.json(result)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/clientes/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const db = await getDb()
  const result = await db.collection('clientes').findOneAndUpdate(
    { _id: new ObjectId(id), tenantId: payload.tenantId },
    { $set: { active: false } },
    { returnDocument: 'after' }
  )
  if (!result) return Response.json({ error: 'Cliente no encontrado' }, { status: 404 })
  return Response.json({ ok: true })
}
