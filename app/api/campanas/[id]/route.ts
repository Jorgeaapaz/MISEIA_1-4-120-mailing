import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/campanas/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const db = await getDb()
  const campana = await db.collection('campanas').findOne({
    _id: new ObjectId(id),
    tenantId: payload.tenantId,
  })
  if (!campana) return Response.json({ error: 'Campaña no encontrada' }, { status: 404 })
  return Response.json(campana)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/campanas/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const db = await getDb()
  const result = await db.collection('campanas').deleteOne({
    _id: new ObjectId(id),
    tenantId: payload.tenantId,
    status: { $in: ['draft', 'sent', 'failed'] },
  })
  if (result.deletedCount === 0) return Response.json({ error: 'Campaña no encontrada o en curso' }, { status: 404 })
  return Response.json({ ok: true })
}
