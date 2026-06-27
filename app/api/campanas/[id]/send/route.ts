export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { extractJwtFromHeader } from '@/lib/auth'
import { renderTemplate } from '@/lib/handlebars'
import { sendMail } from '@/lib/mailer'
import { ObjectId } from 'mongodb'
import type { RecipientLog } from '@/lib/types'

export async function POST(_req: NextRequest, ctx: RouteContext<'/api/campanas/[id]/send'>) {
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
  if (campana.status === 'sending') return Response.json({ error: 'Ya se está enviando' }, { status: 409 })

  const plantilla = await db.collection('plantillas').findOne({
    _id: new ObjectId(campana.plantillaId as string),
    tenantId: payload.tenantId,
  })
  if (!plantilla) return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 })

  // Marcar como enviando
  await db.collection('campanas').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'sending', logs: [] } })

  // Obtener clientes del segmento
  const clientFilter: Record<string, unknown> = { tenantId: payload.tenantId, active: true }
  if (campana.segment !== 'all') clientFilter.tags = campana.segment

  const clientes = await db.collection('clientes').find(clientFilter).toArray()

  const logs: RecipientLog[] = []

  for (const cliente of clientes) {
    const context = {
      name: cliente.name,
      email: cliente.email,
      ...cliente.metadata,
    }
    try {
      const html = renderTemplate(plantilla.htmlBody as string, context)
      const subject = renderTemplate(plantilla.subject as string, context)
      await sendMail({ to: cliente.email as string, subject, html })
      logs.push({
        recipientEmail: cliente.email as string,
        recipientName: cliente.name as string,
        status: 'sent',
        sentAt: new Date(),
      })
    } catch (err) {
      logs.push({
        recipientEmail: cliente.email as string,
        recipientName: cliente.name as string,
        status: 'failed',
        sentAt: new Date(),
        error: (err as Error).message,
      })
    }
  }

  const allFailed = logs.length > 0 && logs.every((l) => l.status === 'failed')

  await db.collection('campanas').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: allFailed ? 'failed' : 'sent', logs, sentAt: new Date() } }
  )

  return Response.json({ sent: logs.filter((l) => l.status === 'sent').length, failed: logs.filter((l) => l.status === 'failed').length })
}
