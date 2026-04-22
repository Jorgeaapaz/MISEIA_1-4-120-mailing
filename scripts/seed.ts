import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = 'mongodb://localhost:27017'
const MONGODB_DB = 'mailing_saas'

async function seed() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(MONGODB_DB)

  // Limpiar colecciones para empezar limpio
  await Promise.all([
    db.collection('tenants').deleteMany({}),
    db.collection('magic_tokens').deleteMany({}),
    db.collection('clientes').deleteMany({}),
    db.collection('plantillas').deleteMany({}),
    db.collection('campanas').deleteMany({}),
  ])

  console.log('✓ Colecciones limpiadas')

  // ─── Tenant ───────────────────────────────────────────────────────────────
  const tenantId = new ObjectId()
  await db.collection('tenants').insertOne({
    _id: tenantId,
    email: 'admin@acme.com',
    name: 'Acme Corp',
    createdAt: new Date(),
  })
  console.log(`✓ Tenant creado: Acme Corp (${tenantId})`)

  // ─── Clientes ─────────────────────────────────────────────────────────────
  const clientes = [
    { name: 'Ana García',     email: 'ana.garcia@example.com',    tags: ['newsletter', 'vip'],         metadata: { ciudad: 'Madrid',    plan: 'pro' } },
    { name: 'Pedro López',    email: 'pedro.lopez@example.com',   tags: ['newsletter'],                metadata: { ciudad: 'Barcelona', plan: 'basic' } },
    { name: 'María Sánchez',  email: 'maria.sanchez@example.com', tags: ['newsletter', 'vip'],         metadata: { ciudad: 'Sevilla',   plan: 'pro' } },
    { name: 'Carlos Ruiz',    email: 'carlos.ruiz@example.com',   tags: ['reactivacion'],              metadata: { ciudad: 'Valencia',  plan: 'basic' } },
    { name: 'Lucía Martínez', email: 'lucia.martinez@example.com',tags: ['newsletter', 'vip', 'beta'], metadata: { ciudad: 'Bilbao',    plan: 'enterprise' } },
    { name: 'Javier Torres',  email: 'javier.torres@example.com', tags: ['reactivacion'],              metadata: { ciudad: 'Zaragoza',  plan: 'basic' } },
    { name: 'Elena Fernández',email: 'elena.fernandez@example.com',tags: ['newsletter', 'beta'],       metadata: { ciudad: 'Málaga',    plan: 'pro' } },
    { name: 'Miguel Díaz',    email: 'miguel.diaz@example.com',   tags: ['vip'],                       metadata: { ciudad: 'Murcia',    plan: 'pro' } },
    { name: 'Sara Jiménez',   email: 'sara.jimenez@example.com',  tags: ['newsletter'],                metadata: { ciudad: 'Alicante',  plan: 'basic' } },
    { name: 'David Moreno',   email: 'david.moreno@example.com',  tags: ['reactivacion', 'vip'],       metadata: { ciudad: 'Valladolid',plan: 'pro' } },
  ]

  const clienteDocs = clientes.map((c) => ({
    ...c,
    tenantId: tenantId.toString(),
    active: true,
    createdAt: new Date(),
  }))
  await db.collection('clientes').insertMany(clienteDocs)
  console.log(`✓ ${clientes.length} clientes creados`)

  // ─── Plantillas ───────────────────────────────────────────────────────────
  const now = new Date()

  const plantillaBienvenida = {
    _id: new ObjectId(),
    tenantId: tenantId.toString(),
    name: 'Bienvenida',
    subject: 'Bienvenido/a a Acme, {{name}} 👋',
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#fff">
  <div style="background:#4F46E5;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:24px">¡Bienvenido/a, {{name}}!</h1>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <p style="color:#374151;font-size:16px;line-height:1.6">
      Nos alegra que te hayas unido a <strong>Acme Corp</strong>. Tu cuenta está lista y ya puedes empezar.
    </p>
    <p style="color:#374151;font-size:16px;line-height:1.6">
      Estás registrado desde <strong>{{ciudad}}</strong> con el plan <strong>{{plan}}</strong>.
    </p>
    <div style="margin:24px 0;text-align:center">
      <a href="#" style="background:#4F46E5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
        Acceder a mi cuenta
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;margin-top:32px">
      Si tienes alguna duda, responde a este email. Estamos aquí para ayudarte.<br>
      — El equipo de Acme
    </p>
  </div>
</div>`,
    variables: ['name', 'ciudad', 'plan'],
    createdAt: now,
    updatedAt: now,
  }

  const plantillaNewsletter = {
    _id: new ObjectId(),
    tenantId: tenantId.toString(),
    name: 'Newsletter Mensual',
    subject: 'Novedades de abril, {{name}} 📬',
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#fff">
  <div style="border-bottom:3px solid #4F46E5;padding-bottom:16px;margin-bottom:24px">
    <h2 style="color:#4F46E5;margin:0;font-size:22px">Acme Newsletter — Abril 2026</h2>
  </div>
  <p style="color:#374151;font-size:15px">Hola <strong>{{name}}</strong>,</p>
  <p style="color:#374151;font-size:15px;line-height:1.6">
    Este mes hemos lanzado nuevas funcionalidades que te encantarán. Aquí te contamos todo lo nuevo:
  </p>
  <div style="background:#f9fafb;border-left:4px solid #4F46E5;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0">
    <h3 style="color:#1f2937;margin:0 0 8px">🚀 Nueva funcionalidad A</h3>
    <p style="color:#6b7280;margin:0;font-size:14px">Descripción breve de la funcionalidad y su beneficio para el usuario.</p>
  </div>
  <div style="background:#f9fafb;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0">
    <h3 style="color:#1f2937;margin:0 0 8px">✨ Mejora en B</h3>
    <p style="color:#6b7280;margin:0;font-size:14px">Hemos mejorado la experiencia en el módulo B. Ahora es un 40% más rápido.</p>
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="#" style="background:#4F46E5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
      Ver todas las novedades
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
  <p style="color:#9ca3af;font-size:12px;text-align:center">
    Estás recibiendo este email porque te suscribiste al newsletter desde {{ciudad}}.<br>
    <a href="#" style="color:#6b7280">Darse de baja</a>
  </p>
</div>`,
    variables: ['name', 'ciudad'],
    createdAt: now,
    updatedAt: now,
  }

  const plantillaReactivacion = {
    _id: new ObjectId(),
    tenantId: tenantId.toString(),
    name: 'Reactivación',
    subject: '{{name}}, te echamos de menos 💙',
    htmlBody: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#fff">
  <div style="text-align:center;padding:32px 0 16px">
    <div style="font-size:48px">💙</div>
    <h2 style="color:#1f2937;font-size:26px;margin:8px 0">{{name}}, ¿todo bien?</h2>
    <p style="color:#6b7280;font-size:15px">Hace tiempo que no te vemos por aquí.</p>
  </div>
  <div style="background:#eff6ff;border-radius:12px;padding:24px;margin:20px 0;text-align:center">
    <p style="color:#1d4ed8;font-size:16px;font-weight:bold;margin:0 0 8px">
      Vuelve hoy y disfruta de un 20% de descuento
    </p>
    <p style="color:#374151;font-size:14px;margin:0">
      Válido solo para clientes con plan <strong>{{plan}}</strong>.
    </p>
  </div>
  <div style="text-align:center;margin:24px 0">
    <a href="#" style="background:#4F46E5;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
      Recuperar mi cuenta
    </a>
  </div>
  <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:32px">
    Si ya no deseas recibir emails, <a href="#" style="color:#6b7280">darse de baja</a>.
  </p>
</div>`,
    variables: ['name', 'plan'],
    createdAt: now,
    updatedAt: now,
  }

  await db.collection('plantillas').insertMany([
    plantillaBienvenida,
    plantillaNewsletter,
    plantillaReactivacion,
  ])
  console.log('✓ 3 plantillas creadas (Bienvenida, Newsletter, Reactivación)')

  // ─── Campaña draft de ejemplo ─────────────────────────────────────────────
  await db.collection('campanas').insertOne({
    tenantId: tenantId.toString(),
    name: 'Newsletter Abril 2026',
    plantillaId: plantillaNewsletter._id.toString(),
    plantillaName: plantillaNewsletter.name,
    segment: 'newsletter',
    status: 'draft',
    logs: [],
    createdAt: new Date(),
  })
  console.log('✓ Campaña draft "Newsletter Abril 2026" creada (segmento: newsletter)')

  // ─── Resumen ──────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────')
  console.log('Seed completado. Para entrar a la app:')
  console.log('  1. npm run dev')
  console.log('  2. Abre http://localhost:3000/login')
  console.log('  3. Introduce: admin@acme.com')
  console.log('  4. Revisa MailHog en http://localhost:8025')
  console.log('─────────────────────────────────────────\n')

  await client.close()
}

seed().catch((err) => {
  console.error('Error en seed:', err)
  process.exit(1)
})
