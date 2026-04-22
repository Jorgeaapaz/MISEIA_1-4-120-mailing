import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import type { Campana } from '@/lib/types'

export async function GET(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const db = await getDb()
  const campanas = await db
    .collection<Campana>('campanas')
    .find({ tenantId: payload.tenantId })
    .sort({ createdAt: -1 })
    .toArray()
  return Response.json(campanas)
}

export async function POST(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  if (!body.name || !body.plantillaId || !body.segment) {
    return Response.json({ error: 'name, plantillaId y segment son requeridos' }, { status: 400 })
  }

  const db = await getDb()

  const plantilla = await db.collection('plantillas').findOne({
    _id: new (await import('mongodb')).ObjectId(body.plantillaId),
    tenantId: payload.tenantId,
  })
  if (!plantilla) return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 })

  const campana: Campana = {
    tenantId: payload.tenantId,
    name: body.name,
    plantillaId: body.plantillaId,
    plantillaName: plantilla.name as string,
    segment: body.segment,
    status: 'draft',
    logs: [],
    createdAt: new Date(),
  }

  const result = await db.collection('campanas').insertOne(campana)
  return Response.json({ ...campana, _id: result.insertedId }, { status: 201 })
}
