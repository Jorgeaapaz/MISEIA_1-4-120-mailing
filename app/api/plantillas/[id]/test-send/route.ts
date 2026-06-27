export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import { renderTemplate } from '@/lib/handlebars'
import { sendMail } from '@/lib/mailer'
import { ObjectId } from 'mongodb'

export async function POST(_req: NextRequest, ctx: RouteContext<'/api/plantillas/[id]/test-send'>) {
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

  const body = await req.json()
  const { to, context } = body
  if (!to) return Response.json({ error: 'Destinatario requerido' }, { status: 400 })

  try {
    const html = renderTemplate(plantilla.htmlBody as string, context || {})
    const subject = renderTemplate(plantilla.subject as string, context || {})
    await sendMail({ to, subject, html })
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: `Error al enviar: ${(err as Error).message}` }, { status: 500 })
  }
}
