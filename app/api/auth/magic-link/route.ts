import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { sendMail } from '@/lib/mailer'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email requerido' }, { status: 400 })
    }

    const db = await getDb()

    // Buscar o crear tenant por email
    let tenant = await db.collection('tenants').findOne({ email: email.toLowerCase() })
    if (!tenant) {
      const result = await db.collection('tenants').insertOne({
        email: email.toLowerCase(),
        name: email.split('@')[0],
        createdAt: new Date(),
      })
      tenant = { _id: result.insertedId, email: email.toLowerCase(), name: email.split('@')[0] }
    }

    // Generar token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    await db.collection('magic_tokens').insertOne({
      email: email.toLowerCase(),
      tenantId: tenant._id.toString(),
      token,
      expiresAt,
      used: false,
    })

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const link = `${baseUrl}/verify?token=${token}`

    await sendMail({
      to: email,
      subject: 'Tu enlace de acceso — Mailing SaaS',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2 style="color:#4F46E5">Accede a Mailing SaaS</h2>
          <p>Haz clic en el siguiente enlace para entrar. Expira en 15 minutos.</p>
          <a href="${link}" style="display:inline-block;background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
            Entrar ahora
          </a>
          <p style="color:#888;margin-top:24px;font-size:12px">Si no solicitaste este enlace, ignora este email.</p>
        </div>
      `,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[magic-link]', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
