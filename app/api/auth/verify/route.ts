export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { signJwt } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return Response.json({ error: 'Token requerido' }, { status: 400 })
    }

    const db = await getDb()
    const magicToken = await db.collection('magic_tokens').findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() },
    })

    if (!magicToken) {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }

    // Marcar token como usado
    await db.collection('magic_tokens').updateOne({ _id: magicToken._id }, { $set: { used: true } })

    // Buscar tenant
    const tenant = await db.collection('tenants').findOne({ _id: magicToken.tenantId as unknown as import('mongodb').ObjectId })

    const jwtToken = signJwt({
      tenantId: magicToken.tenantId,
      userId: magicToken.tenantId, // owner = tenant
      email: magicToken.email,
      role: 'admin',
    })

    return Response.json({
      token: jwtToken,
      user: {
        email: magicToken.email,
        tenantId: magicToken.tenantId,
        tenantName: tenant?.name || magicToken.email,
        role: 'admin',
      },
    })
  } catch (err) {
    console.error('[verify]', err)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
