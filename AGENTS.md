<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Mailing SaaS — Microprompt

## Visión del producto

SaaS multitenant para envío de emails a listas de clientes. Cada tenant gestiona sus propios clientes, plantillas y envíos de forma aislada.

## Funcionalidades principales

### Autenticación
- Magic link: el usuario introduce su email, recibe un enlace con token firmado (JWT), al hacer clic queda autenticado.
- JWT almacenado en `localStorage`. Incluye `tenantId`, `userId`, `email`, `role`.
- No hay contraseñas. No hay sesiones en servidor.

### Multitenancy
- Cada recurso (cliente, plantilla, envío) pertenece a un `tenantId`.
- Todas las queries a MongoDB deben filtrar siempre por `tenantId`.
- El `tenantId` se extrae del JWT en cada API route.

### CRUD de Clientes
- Campos: `name`, `email`, `tags[]`, `metadata{}`, `tenantId`, `createdAt`, `active`.
- Listado con filtro por tag y búsqueda por nombre/email.
- Importación CSV (nombre, email, tags).
- Baja lógica (`active: false`), no borrado físico.

### CRUD de Plantillas de Email
- Campos: `name`, `subject`, `htmlBody`, `variables[]`, `tenantId`, `createdAt`, `updatedAt`.
- Editor de plantillas con sintaxis Handlebars (`{{variable}}`).
- Preview en tiempo real renderizando la plantilla con datos de prueba.
- Envío de email de prueba a una dirección arbitraria usando MailHog.

### Envíos (Campaigns)
- Seleccionar plantilla + segmento de clientes (todos o por tag).
- Personalización por cliente usando Handlebars con los datos del cliente como contexto.
- Estado del envío: `draft`, `sending`, `sent`, `failed`.
- Registro de envío por destinatario: `recipientEmail`, `status`, `sentAt`, `error`.

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js + TypeScript |
| Base de datos | MongoDB (driver nativo vía `lib/db.ts`) |
| Plantillas | Handlebars (`handlebars` npm package) |
| Mail | MailHog (SMTP en puerto 1025, UI en 8025) |
| Auth | JWT (`jsonwebtoken`) + magic link |

## Estructura de carpetas

```
app/
  (auth)/
    login/          # Página magic link (introduce email)
    verify/         # Página que valida el token del enlace
  (dashboard)/
    clientes/       # CRUD clientes
    plantillas/     # CRUD + preview plantillas
    campanas/       # Crear y enviar campañas
    settings/       # Configuración del tenant
  api/
    auth/
      magic-link/   # Genera y envía el magic link
      verify/       # Valida token y devuelve JWT
    clientes/       # CRUD API
    plantillas/     # CRUD + preview/test API
    campanas/       # API de envío
lib/
  db.ts             # Singleton MongoClient
  types.ts          # Interfaces TypeScript
  auth.ts           # signJwt, verifyJwt, extractTenant
  mailer.ts         # sendMail usando nodemailer → MailHog
  handlebars.ts     # renderTemplate(template, context)
components/
  TemplateEditor/   # Editor Handlebars + preview
  ClientTable/      # Tabla con filtros
  CampaignForm/     # Selector plantilla + segmento
```

## Reglas de implementación

1. Leer los docs de Next.js en `node_modules/next/dist/docs` antes de usar cualquier API.
2. Todo acceso a MongoDB pasa por `lib/db.ts` — nunca crear `MongoClient` inline.
3. Todas las API routes extraen `tenantId` del JWT; devuelven `401` si falta o es inválido.
4. Nunca filtrar datos sin incluir `{ tenantId }` en la query de MongoDB.
5. API routes devuelven `{ error: string }` en fallo con el HTTP status apropiado.
6. Sin tipos `any` — todas las interfaces van en `lib/types.ts`.
7. Server components leen MongoDB directamente; client components llaman a API routes.
8. Usar el skill `frontend-design` para cada página/componente nuevo.
9. No usar `middleware.ts` — usar proxy en su lugar.
10. Usar `GlobalContext` para estado global (usuario autenticado, tenantId, preferencias).

## Variables de entorno requeridas

```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=mailing_saas

MAILHOG_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@mailing.local

JWT_SECRET=<secreto aleatorio largo>
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## Diseño visual

- Fondo claro, texto oscuro.
- Un color de acento consistente en toda la UI (sugerido: índigo `#4F46E5`).
- Tipografía bold para títulos, CTAs claros.
- Sin imágenes — placeholders con CSS e iconos de color por categoría.
- Layout responsive, mobile-first.

## Flujos críticos a cubrir con Playwright

1. Login por magic link end-to-end (envío email → clic enlace → dashboard).
2. Crear cliente → aparece en listado → editar → dar de baja.
3. Crear plantilla con variables Handlebars → preview en tiempo real → envío de prueba.
4. Crear campaña → seleccionar plantilla + segmento → enviar → verificar registros de envío.

## Al finalizar

Ejecutar `npm run build` y, si pasa, usar el skill `session-retrospective` para generar el informe de retrospectiva.
