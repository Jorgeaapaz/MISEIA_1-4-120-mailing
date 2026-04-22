# Retrospectiva de Sesión — 2026-04-22
### Implementación completa del Mailing SaaS multitenant

---

## Resumen / Overview

Se implementó desde cero un SaaS multitenant de envío de emails sobre la base de un proyecto Next.js 16 en blanco. La sesión incluyó la definición del microprompt en `AGENTS.md`, la implementación completa del backend (API routes), el frontend (páginas y componentes), la capa de acceso a datos (MongoDB), el sistema de plantillas (Handlebars) y el sistema de envío de emails (MailHog). El build de producción finalizó sin errores TypeScript.

---

## Proceso de instalación / Installation

### 1. Dependencias añadidas al proyecto base

```bash
npm install mongodb nodemailer handlebars jsonwebtoken @types/nodemailer @types/jsonwebtoken
```

### 2. Variables de entorno

Crear el fichero `.env.local` en la raíz del proyecto:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=mailing_saas

MAILHOG_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@mailing.local

JWT_SECRET=mailing-saas-super-secret-jwt-key-cambiar-en-produccion-2026

NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

> **Importante:** Cambiar `JWT_SECRET` por un valor aleatorio largo en cualquier entorno no local.

### 3. Servicios externos requeridos

| Servicio   | Descripción                        | Verificación                   |
|------------|------------------------------------|--------------------------------|
| MongoDB    | Instalado localmente en el host    | `mongodb://localhost:27017`    |
| MailHog    | Corriendo en Docker                | UI en `http://localhost:8025`  |

---

## Arquitectura del proyecto / Project Structure

```
mailing/
├── app/
│   ├── api/
│   │   ├── auth/magic-link/route.ts   — Genera y envía magic link por email
│   │   ├── auth/verify/route.ts       — Valida token → devuelve JWT
│   │   ├── clientes/route.ts          — GET (filtros/búsqueda) + POST
│   │   ├── clientes/[id]/route.ts     — GET + PUT + DELETE (baja lógica)
│   │   ├── clientes/import/route.ts   — POST CSV bulk import
│   │   ├── plantillas/route.ts        — GET + POST
│   │   ├── plantillas/[id]/route.ts   — GET + PUT + DELETE
│   │   ├── plantillas/[id]/preview/   — POST renderiza Handlebars con contexto
│   │   ├── plantillas/[id]/test-send/ — POST envía email de prueba a MailHog
│   │   ├── campanas/route.ts          — GET + POST
│   │   ├── campanas/[id]/route.ts     — GET + DELETE
│   │   └── campanas/[id]/send/route.ts — POST envía campaña a segmento
│   ├── login/page.tsx                 — Formulario magic link
│   ├── verify/page.tsx                — Valida token URL → redirige al dashboard
│   ├── dashboard/page.tsx             — Stats + acciones rápidas
│   ├── clientes/                      — Listado, nuevo, editar, importar CSV
│   ├── plantillas/                    — Listado, nueva, editar, preview + test
│   └── campanas/                      — Listado, nueva, logs de envío por destinatario
├── components/
│   ├── DashboardNav.tsx               — Sidebar indigo con navegación
│   └── AuthGuard.tsx                  — Redirige a /login si no hay JWT
├── context/
│   └── GlobalContext.tsx              — user, token, authHeader(), login/logout
├── lib/
│   ├── db.ts                          — Singleton MongoClient (dev-safe)
│   ├── types.ts                       — Interfaces TS + WithId<T>
│   ├── auth.ts                        — signJwt / verifyJwt / extractJwtFromHeader
│   ├── mailer.ts                      — sendMail via nodemailer → MailHog
│   └── handlebars.ts                  — renderTemplate + extractVariables
├── proxy.ts                           — Proxy Next.js 16 (reemplaza middleware.ts)
└── .env.local                         — Variables de entorno locales
```

---

## Comandos ejecutados / Commands Run

```bash
# Instalar dependencias
npm install mongodb nodemailer handlebars jsonwebtoken @types/nodemailer @types/jsonwebtoken

# Verificar build de producción
npm run build

# Arrancar en desarrollo
npm run dev

# Commit
git add -A
git commit -m "feat: implementar Mailing SaaS multitenant completo"
```

---

## Levantar y detener la aplicación / Running & Stopping

### Arrancar

```bash
# 1. Asegurarse de que MongoDB está corriendo en localhost:27017
# 2. Asegurarse de que MailHog está corriendo (Docker)
docker start mailhog   # o el nombre de tu contenedor

# 3. Arrancar Next.js en desarrollo
cd D:/Master-IA-Dev/04-Bloque4/1-4-120-mailing/mailing
npm run dev
```

### Detener

```bash
# Ctrl+C en la terminal de Next.js
docker stop mailhog
```

### Flujo de prueba manual

1. Abrir `http://localhost:3000` → redirige a `/login`
2. Introducir cualquier email (ej: `test@example.com`)
3. Abrir MailHog UI en `http://localhost:8025` → hacer clic en el enlace del email
4. El navegador va a `/verify?token=...` → autentica y redirige al dashboard

---

## URLs de prueba / Test URLs

| Recurso               | URL                                        |
|-----------------------|--------------------------------------------|
| App (redirige a login)| `http://localhost:3000`                    |
| Login (magic link)    | `http://localhost:3000/login`              |
| Dashboard             | `http://localhost:3000/dashboard`          |
| Clientes              | `http://localhost:3000/clientes`           |
| Plantillas            | `http://localhost:3000/plantillas`         |
| Campañas              | `http://localhost:3000/campanas`           |
| MailHog UI            | `http://localhost:8025`                    |

### Ejemplos curl para la API (requieren JWT en header)

```bash
# 1. Solicitar magic link
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 2. Verificar token (copiar token del email en MailHog)
curl "http://localhost:3000/api/auth/verify?token=TOKEN_AQUI"
# Devuelve: { "token": "JWT...", "user": {...} }

# 3. Listar clientes (usar el JWT del paso anterior)
curl http://localhost:3000/api/clientes \
  -H "Authorization: Bearer JWT_AQUI"

# 4. Crear cliente
curl -X POST http://localhost:3000/api/clientes \
  -H "Authorization: Bearer JWT_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana García","email":"ana@example.com","tags":["newsletter"]}'

# 5. Listar plantillas
curl http://localhost:3000/api/plantillas \
  -H "Authorization: Bearer JWT_AQUI"

# 6. Enviar campaña
curl -X POST http://localhost:3000/api/campanas/ID_CAMPANA/send \
  -H "Authorization: Bearer JWT_AQUI"
```

---

## Configuración de red / Network Configuration

Esta aplicación corre íntegramente en `localhost`. No se requieren reglas NAT ni port forwarding de VirtualBox para el entorno de desarrollo local en Windows.

Los únicos puertos relevantes son:

| Puerto | Servicio          |
|--------|-------------------|
| 3000   | Next.js (app)     |
| 27017  | MongoDB           |
| 1027   | MailHog SMTP      |
| 8025   | MailHog UI (HTTP) |

---

## Decisiones de diseño / Design Decisions

| Decisión | Motivo |
|----------|--------|
| `proxy.ts` en lugar de `middleware.ts` | Next.js 16 renombra middleware a proxy; el fichero debe llamarse `proxy.ts` |
| JWT en `localStorage` | Requerimiento del microprompt; en producción valorar `httpOnly cookies` |
| Baja lógica de clientes (`active: false`) | Preserva histórico de envíos; no se borran físicamente |
| `WithId<T>` en tipos de respuesta API | MongoDB serializa `_id` como string en JSON; los interfaces no incluyen `_id` para evitar conflictos con `OptionalId<Document>` |
| `useSearchParams()` en Suspense | Next.js 16 requiere Suspense boundary para `useSearchParams` en rutas estáticas |
| Singleton MongoClient en `global._mongoClient` | Evita múltiples conexiones en hot-reload de desarrollo |

---

## Problemas encontrados / Problems & Solutions

| Problema | Solución |
|----------|----------|
| `Type 'string' is not assignable to type 'ObjectId'` en `insertOne` | Eliminé `_id?: string` de las interfaces de dominio; creé el tipo helper `WithId<T>` para los objetos devueltos por la API |
| `Type 'undefined' is not assignable to type 'string'` en `authHeader` | Añadí tipado explícito de retorno `(): Record<string, string>` en el `useCallback` |
| `useSearchParams() should be wrapped in a suspense boundary` en `/verify` | Separé el contenido en `<VerifyContent>` y lo envolví con `<Suspense>` en el componente raíz de la página |

---

## Seed de datos de prueba

Script en `scripts/seed.ts`. Borra y recarga todas las colecciones cada vez que se ejecuta.

```bash
npx tsx scripts/seed.ts
```

### Datos cargados

**Tenant:** `admin@acme.com` — Acme Corp

**10 clientes** distribuidos en 4 tags:

| Nombre           | Email                        | Tags                        | Ciudad      | Plan       |
|------------------|------------------------------|-----------------------------|-------------|------------|
| Ana García       | ana.garcia@example.com       | newsletter, vip             | Madrid      | pro        |
| Pedro López      | pedro.lopez@example.com      | newsletter                  | Barcelona   | basic      |
| María Sánchez    | maria.sanchez@example.com    | newsletter, vip             | Sevilla     | pro        |
| Carlos Ruiz      | carlos.ruiz@example.com      | reactivacion                | Valencia    | basic      |
| Lucía Martínez   | lucia.martinez@example.com   | newsletter, vip, beta       | Bilbao      | enterprise |
| Javier Torres    | javier.torres@example.com    | reactivacion                | Zaragoza    | basic      |
| Elena Fernández  | elena.fernandez@example.com  | newsletter, beta            | Málaga      | pro        |
| Miguel Díaz      | miguel.diaz@example.com      | vip                         | Murcia      | pro        |
| Sara Jiménez     | sara.jimenez@example.com     | newsletter                  | Alicante    | basic      |
| David Moreno     | david.moreno@example.com     | reactivacion, vip           | Valladolid  | pro        |

**3 plantillas** con HTML estilizado y variables Handlebars:

| Nombre             | Asunto                              | Variables                   |
|--------------------|-------------------------------------|-----------------------------|
| Bienvenida         | Bienvenido/a a Acme, {{name}} 👋   | `name`, `ciudad`, `plan`    |
| Newsletter Mensual | Novedades de abril, {{name}} 📬    | `name`, `ciudad`            |
| Reactivación       | {{name}}, te echamos de menos 💙   | `name`, `plan`              |

**1 campaña draft:** "Newsletter Abril 2026" — plantilla Newsletter Mensual, segmento `newsletter`, lista para enviar.

### Acceso tras el seed

```
npm run dev
→ http://localhost:3000/login
→ Email: admin@acme.com
→ Ver enlace mágico en http://localhost:8025 (MailHog UI)
```

---

## Resultados y conclusiones / Results & Conclusions

### Qué funcionó
- Build de producción sin errores TypeScript ni errores de runtime (20 rutas)
- Arquitectura multitenant correcta: todas las queries filtran por `tenantId` extraído del JWT
- Preview de plantillas Handlebars en tiempo real con iframe
- Importación CSV de clientes en bulk
- Campañas con log detallado por destinatario (enviado/fallido)
- Sistema de magic link completo end-to-end con MailHog

### Próximos pasos recomendados
- Añadir tests Playwright para los flujos críticos (login, CRUD clientes, preview plantilla, envío campaña)
- Añadir tests Jest para `lib/handlebars.ts` y `lib/auth.ts`
- Paginación en listados de clientes y campañas para tenants grandes
- Envío asíncrono de campañas (background job) para listas grandes
- Rate limiting en `/api/auth/magic-link` para evitar abuso
- Panel de settings del tenant (nombre, email remitente por defecto)
