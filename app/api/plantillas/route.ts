export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import { extractVariables } from '@/lib/handlebars'
import type { Plantilla } from '@/lib/types'

export async function GET(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const db = await getDb()
  const plantillas = await db
    .collection<Plantilla>('plantillas')
    .find({ tenantId: payload.tenantId })
    .sort({ updatedAt: -1 })
    .toArray()
  return Response.json(plantillas)
}

export async function POST(req: NextRequest) {
  const payload = extractJwtFromHeader(req.headers.get('authorization'))
  if (!payload) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  if (!body.name || !body.subject || !body.htmlBody) {
    return Response.json({ error: 'name, subject y htmlBody son requeridos' }, { status: 400 })
  }

  const db = await getDb()
  const now = new Date()
  const plantilla: Plantilla = {
    tenantId: payload.tenantId,
    name: body.name,
    subject: body.subject,
    htmlBody: body.htmlBody,
    variables: extractVariables(body.htmlBody),
    createdAt: now,
    updatedAt: now,
  }

  const result = await db.collection('plantillas').insertOne(plantilla)
  return Response.json({ ...plantilla, _id: result.insertedId }, { status: 201 })
}
