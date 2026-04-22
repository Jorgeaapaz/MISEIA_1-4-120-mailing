import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import { extractVariables } from '@/lib/handlebars'
import { ObjectId } from 'mongodb'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/plantillas/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const db = await getDb()
  const plantilla = await db.collection('plantillas').findOne({
    _id: new ObjectId(id),
    tenantId: payload.tenantId,
  })
  if (!plantilla) return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 })
  return Response.json(plantilla)
}

export async function PUT(_req: NextRequest, ctx: RouteContext<'/api/plantillas/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const body = await req.json()
  const db = await getDb()

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (body.name !== undefined) update.name = body.name
  if (body.subject !== undefined) update.subject = body.subject
  if (body.htmlBody !== undefined) {
    update.htmlBody = body.htmlBody
    update.variables = extractVariables(body.htmlBody)
  }

  const result = await db.collection('plantillas').findOneAndUpdate(
    { _id: new ObjectId(id), tenantId: payload.tenantId },
    { $set: update },
    { returnDocument: 'after' }
  )
  if (!result) return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 })
  return Response.json(result)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/plantillas/[id]'>) {
  const req = _req
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await ctx.params
  const db = await getDb()
  const result = await db.collection('plantillas').deleteOne({
    _id: new ObjectId(id),
    tenantId: payload.tenantId,
  })
  if (result.deletedCount === 0) return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 })
  return Response.json({ ok: true })
}
