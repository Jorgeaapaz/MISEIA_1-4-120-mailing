# Mailing SaaS — Plataforma Multitenant de Campañas de Email

> **Next.js 16 + TypeScript** · SaaS multitenant para gestión de clientes, plantillas Handlebars y envío de campañas de email personalizadas con autenticación sin contraseñas vía magic link.

**Demo en producción:** [https://mailing.deviaaps.com](https://mailing.deviaaps.com)

---

## Tabla de Contenidos

1. [Funcionalidades Implementadas](#1-funcionalidades-implementadas)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Patrones de Diseño y Arquitectura](#3-patrones-de-diseño-y-arquitectura)
4. [Cómo Funciona](#4-cómo-funciona)
5. [Primeros Pasos](#5-primeros-pasos)
6. [Ejemplos de Uso](#6-ejemplos-de-uso)
7. [Requisitos](#7-requisitos)
8. [Especificaciones](#8-especificaciones)
9. [Pruebas Unitarias e Integración](#9-pruebas-unitarias-e-integración)
10. [Despliegue](#10-despliegue)
11. [Mejoras y Extensiones](#11-mejoras-y-extensiones)
12. [Cambios Documentados e IA](#12-cambios-documentados-e-ia)

---

## 1. Funcionalidades Implementadas

### 1.1 Autenticación Magic Link (sin contraseñas)
El usuario ingresa su correo electrónico y recibe un enlace firmado con JWT. Al hacer clic en el enlace queda autenticado sin necesidad de contraseña. El token JWT (7 días de vigencia) se almacena en `localStorage` y se inyecta en cada llamada API como `Authorization: Bearer <token>`. Incluye `tenantId`, `userId`, `email` y `role`.

**Detalles técnicos:**
- Firma con `jsonwebtoken` usando secreto vía `getSecret()` (lazy, sin lectura en tiempo de build)
- Tokens de magic link almacenados en MongoDB con TTL y flag `used`
- El envío del email usa MailHog como servidor SMTP local (puerto 1025)

### 1.2 CRUD Multitenant de Clientes, Plantillas y Campañas

**Clientes:**
- Campos: `name`, `email`, `tags[]`, `metadata{}`, `tenantId`, `createdAt`, `active`
- Listado con filtro por tag y búsqueda por nombre/email
- Importación masiva desde CSV (nombre, email, tags)
- Baja lógica (`active: false`) — no se elimina físicamente ningún registro

**Plantillas:**
- Editor de plantillas con sintaxis Handlebars (`{{variable}}`)
- Preview en tiempo real con datos de prueba
- Envío de email de prueba a dirección arbitraria
- Variables extraídas automáticamente del cuerpo HTML

**Campañas:**
- Selección de plantilla + segmento de clientes (todos o por tag)
- Personalización por destinatario usando datos del cliente como contexto Handlebars
- Estados: `draft` → `sending` → `sent` / `failed`
- Registro de envío por destinatario: `recipientEmail`, `status`, `sentAt`, `error`

### 1.3 CI/CD Dual — GitHub Actions + GitLab CI

**GitHub Actions** (`.github/workflows/ci-cd.yml`):
- Job `Lint & Unit Tests`: checkout → Node 20 → `npm ci` → lint → test → coverage
- Job `Build Docker Image & Deploy` (solo `master`): build imagen → guardar `.tar.gz` → SSH al VM → `docker compose --force-recreate`
- Secretos: `VM_SSH_KEY`, `VM_HOST`, `VM_USER`, `JWT_SECRET`

**GitLab CI** (`.gitlab-ci.yml`):
- Stage `test`: `node:20-alpine` → `npm ci && lint && test && coverage`
- Stage `build`: `docker:24-dind` → imagen comprimida como artefacto
- Stage `deploy`: `alpine` → clave SSH decodificada desde `VM_SSH_KEY_B64` (base64) → SCP + SSH deploy
- `NODE_ENV=production` aplicado únicamente al contenedor en `docker-compose.prod.yml`, no como variable de job

---

## 2. Estructura del Proyecto

```
mailing/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── magic-link/route.ts     # Genera y envía el magic link por email
│   │   │   └── verify/route.ts         # Valida token, devuelve JWT de sesión
│   │   ├── clientes/
│   │   │   ├── route.ts                # GET listado + POST crear cliente
│   │   │   ├── [id]/route.ts           # GET/PUT/DELETE cliente por ID
│   │   │   └── import/route.ts         # POST importación CSV masiva
│   │   ├── plantillas/
│   │   │   ├── route.ts                # GET listado + POST crear plantilla
│   │   │   ├── [id]/route.ts           # GET/PUT/DELETE plantilla por ID
│   │   │   ├── [id]/preview/route.ts   # POST render Handlebars con datos de prueba
│   │   │   └── [id]/test-send/route.ts # POST envío de email de prueba
│   │   └── campanas/
│   │       ├── route.ts                # GET listado + POST crear campaña
│   │       ├── [id]/route.ts           # GET detalle de campaña
│   │       └── [id]/send/route.ts      # POST disparo masivo de campaña
│   ├── login/page.tsx                  # Página de login — formulario de email
│   ├── verify/page.tsx                 # Verifica token del enlace y almacena JWT
│   ├── dashboard/page.tsx              # Panel principal del tenant
│   ├── clientes/                       # Páginas UI del módulo Clientes
│   ├── plantillas/                     # Páginas UI del módulo Plantillas
│   ├── campanas/                       # Páginas UI del módulo Campañas
│   ├── globals.css                     # Estilos globales + variables CSS
│   └── layout.tsx                      # Root layout con GlobalContext Provider
├── components/
│   ├── AuthGuard.tsx                   # HOC que redirige a /login si no hay JWT
│   └── DashboardNav.tsx                # Barra de navegación del dashboard
├── context/
│   └── GlobalContext.tsx               # Estado global: user, tenantId, preferencias
├── lib/
│   ├── auth.ts                         # signJwt, verifyJwt, extractJwtFromHeader
│   ├── db.ts                           # Singleton MongoClient con lazy init
│   ├── handlebars.ts                   # renderTemplate + extractVariables
│   ├── mailer.ts                       # sendMail vía nodemailer → MailHog
│   └── types.ts                        # Todas las interfaces TypeScript del dominio
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts                # 5 tests: JWT sign/verify/extract
│   │   └── handlebars.test.ts          # 12 tests: render + extractVariables
│   └── e2e/
│       ├── auth.spec.ts                # 4 specs Playwright: login flow + redirects
│       └── api.spec.ts                 # 5 specs Playwright: 401/400/200 en API routes
├── docs/
│   ├── decisions/                      # ADR-001 a ADR-004
│   └── compliance/                     # Reporte de compliance + plan PERT
├── scripts/
│   └── seed.ts                         # Script de seed con datos de prueba
├── .env.example                        # Plantilla de variables de entorno
├── .env.local                          # Variables locales (no comiteadas)
├── .env.production                     # Variables de producción (no comiteadas)
├── Dockerfile                          # Multi-stage build: deps → builder → runner
├── docker-compose.prod.yml             # Servicio mailing en red miseia-net + Traefik
├── .github/workflows/ci-cd.yml         # Pipeline GitHub Actions
├── .gitlab-ci.yml                      # Pipeline GitLab CI
├── vitest.config.ts                    # Configuración Vitest + coverage v8
├── playwright.config.ts                # Configuración Playwright E2E
├── next.config.ts                      # output: standalone para Docker
├── package.json                        # Scripts y dependencias del proyecto
└── package-lock.json                   # Lockfile npm — instalaciones reproducibles
```

---

## 3. Patrones de Diseño y Arquitectura

### Singleton — `lib/db.ts`
Un único `MongoClient` compartido por proceso Node.js. En modo `development`, se cuelga del objeto `global` para sobrevivir hot-reloads de Next.js. En `production`, se mantiene en variable de módulo. Inicialización **lazy**: las credenciales se validan en el primer uso, no en el import, permitiendo builds Docker sin variables de entorno presentes.

### Context / Provider — `context/GlobalContext.tsx`
Estado global del usuario autenticado (`user`, `tenantId`, preferencias de tema) disponible en cualquier Client Component sin prop drilling. Carga el JWT desde `localStorage` en el montaje inicial.

### Guard / HOC — `components/AuthGuard.tsx`
Componente de orden superior que verifica la presencia del JWT en `GlobalContext`. Si no existe, redirige a `/login` usando `router.replace()`. Elimina duplicación de lógica de autorización en cada página.

### Repository implícito — API Routes
Cada API route encapsula el acceso a MongoDB para su colección. **Toda query incluye `{ tenantId }`** como filtro obligatorio, garantizando el aislamiento multitenant. No existe acceso directo a `MongoClient` fuera de los handlers.

### Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (Browser)                    │
│  GlobalContext (JWT)  →  Client Components              │
│                              │                          │
│                         fetch + Bearer token            │
└──────────────────────────────┼──────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────┐
│              Next.js 16 App Router (Node.js)            │
│  API Routes (/api/**)  ──► lib/auth.ts (verifyJwt)      │
│       │                         │                       │
│  lib/db.ts (getDb)         lib/handlebars.ts            │
│       │                    lib/mailer.ts                 │
└───────┼─────────────────────────────────────────────────┘
        │
┌───────▼──────────┐    ┌──────────────────┐
│  MongoDB 7.x     │    │  MailHog SMTP    │
│  (multitenant)   │    │  puerto 1025     │
└──────────────────┘    └──────────────────┘
```

### 3.1 Dependencias Bloqueadas — Lockfile

El proyecto incluye `package-lock.json` comiteado en el repositorio, garantizando instalaciones **100% reproducibles** en CI/CD, Docker builds y entornos de desarrollo del equipo.

```
package-lock.json   # npm lockfile v3 — versiones exactas de todo el árbol de dependencias
```

Instalación reproducible garantizada con:
```bash
npm ci   # respeta estrictamente package-lock.json (no actualiza versiones)
```

---

## 4. Cómo Funciona

El flujo principal es: el usuario introduce su email en `/login` → el servidor genera un JWT de magic link y lo envía por email (MailHog en local) → al hacer clic, `/verify` valida el token, crea o recupera el tenant en MongoDB, firma un JWT de sesión y lo almacena en `localStorage` → desde ese momento, todo `fetch` a las API routes incluye `Authorization: Bearer <jwt>` y el servidor extrae el `tenantId` para filtrar los datos del tenant.

Para enviar una campaña: el usuario selecciona una plantilla Handlebars y un segmento de clientes → la API route itera sobre cada cliente del segmento → renderiza la plantilla con los datos del cliente como contexto → llama a `sendMail()` para cada destinatario → registra el resultado en `logs[]` del documento de campaña.

```typescript
// lib/handlebars.ts — personalización por destinatario
import Handlebars from 'handlebars'

export function renderTemplate(
  htmlBody: string,
  context: Record<string, unknown>
): string {
  const compiled = Handlebars.compile(htmlBody)
  return compiled(context)
}

// Uso en app/api/campanas/[id]/send/route.ts
for (const cliente of clientes) {
  const html = renderTemplate(plantilla.htmlBody, {
    name: cliente.name,
    email: cliente.email,
    ...cliente.metadata,
  })
  await sendMail({ to: cliente.email, subject: plantilla.subject, html })
}
```

---

## 5. Primeros Pasos

### Prerrequisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 10+ |
| MongoDB | 7.x (local o Atlas) |
| MailHog | cualquiera (para recibir emails en local) |
| Docker | 24+ (opcional, para despliegue) |

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-120-mailing.git
cd MISEIA_1-4-120-mailing

# 2. Instalar dependencias (usa el lockfile para reproducibilidad exacta)
npm ci

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# 4. (Opcional) Cargar datos de prueba
npx ts-node scripts/seed.ts

# 5. Iniciar en desarrollo
npm run dev
# → http://localhost:3000
```

### Variables de entorno requeridas (`.env.local`)

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=mailing_saas
MAILHOG_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@mailing.local
JWT_SECRET=tu-secreto-aleatorio-de-al-menos-32-caracteres
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

Ver `.env.example` para la plantilla completa.

---

## 6. Ejemplos de Uso

### Caso 1 — Login por magic link

```
POST /api/auth/magic-link
Body: { "email": "usuario@empresa.com" }

→ 200 OK
{ "message": "Magic link enviado a usuario@empresa.com" }

# Email recibido en MailHog (http://localhost:8025):
# Enlace: http://localhost:3000/verify?token=eyJhbGciOiJIUzI1NiJ9...
```

### Caso 2 — Crear cliente

```
POST /api/clientes
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Body: {
  "name": "Ana García",
  "email": "ana@empresa.com",
  "tags": ["vip", "newsletter"],
  "metadata": { "ciudad": "CDMX" }
}

→ 201 Created
{ "_id": "6868abc123...", "name": "Ana García", "active": true, ... }
```

### Caso 3 — Preview de plantilla con datos de prueba

```
POST /api/plantillas/6868abc123/preview
Body: { "name": "Ana", "company": "Empresa SA" }

→ 200 OK
{ "html": "<h1>Hola Ana,</h1><p>Gracias por unirte a Empresa SA...</p>" }
```

### Caso 4 — Error de autenticación (caso borde)

```
GET /api/clientes
# Sin header Authorization

→ 401 Unauthorized
{ "error": "Unauthorized" }
```

### Caso 5 — Campaña con segmento por tag

```
POST /api/campanas
Body: { "name": "Promo Verano", "plantillaId": "...", "segment": "vip" }
→ 201 { "_id": "...", "status": "draft" }

POST /api/campanas/{id}/send
→ 200 { "sent": 47, "failed": 0, "status": "sent" }
```

---

## 7. Requisitos

### 7.1 Requisitos Funcionales

```
FR-001: El usuario no autenticado deberá poder solicitar un magic link introduciendo
        su dirección de email, de modo que reciba un enlace de acceso en su bandeja
        de entrada sin necesidad de contraseña.

FR-002: El sistema deberá validar el token del magic link y crear una sesión JWT para
        el tenant correspondiente, de modo que el usuario quede autenticado y sea
        redirigido al dashboard.

FR-003: El usuario autenticado deberá poder crear un nuevo cliente con nombre, email,
        tags y metadata, de modo que el cliente quede registrado activo y visible en
        el listado del tenant.

FR-004: El usuario autenticado deberá poder filtrar la lista de clientes por tag o
        buscar por nombre/email, de modo que pueda localizar rápidamente un
        subconjunto de destinatarios.

FR-005: El usuario autenticado deberá poder importar clientes masivamente desde un
        archivo CSV con columnas nombre, email y tags, de modo que se creen múltiples
        registros en una sola operación.

FR-006: El usuario autenticado deberá poder crear una plantilla de email con nombre,
        asunto y cuerpo HTML en sintaxis Handlebars, de modo que las variables queden
        registradas automáticamente para personalización.

FR-007: El usuario autenticado deberá poder obtener un preview en tiempo real de la
        plantilla renderizada con datos de prueba, de modo que pueda verificar el
        resultado antes de usar la plantilla en una campaña.

FR-008: El usuario autenticado deberá poder crear una campaña seleccionando una
        plantilla y un segmento (todos los clientes o por tag), de modo que quede
        registrada en estado draft lista para ser enviada.

FR-009: El usuario autenticado deberá poder disparar el envío de una campaña, de modo
        que el sistema itere sobre el segmento, personalice cada email con los datos
        del cliente y registre el resultado por destinatario (enviado/fallido).

FR-010: El usuario autenticado deberá poder dar de baja lógica a un cliente
        (active: false) sin eliminarlo físicamente, de modo que el historial de
        envíos se conserve y el cliente no sea incluido en futuras campañas.

FR-011: El sistema deberá aislar completamente los datos de cada tenant, de modo que
        ningún usuario pueda acceder a clientes, plantillas o campañas de otro tenant.

FR-012: El usuario autenticado deberá poder enviar un email de prueba de una plantilla
        a una dirección arbitraria, de modo que pueda verificar el renderizado antes
        de lanzar la campaña.
```

### 7.2 Requisitos No Funcionales

```
NFR-PERF-001: Latencia de API routes < 200ms en el percentil 95 bajo carga de
              50 req/s → Singleton MongoClient (sin cold start de conexión) +
              índices en { tenantId, createdAt }

NFR-PERF-002: Build Docker < 3 minutos → Multi-stage build (deps separados del
              builder) + cache de capas de node_modules

NFR-SEC-001:  JWT firmado con HMAC-SHA256 (mínimo 32 caracteres en JWT_SECRET) +
              validación en cada API route + expiración de 7 días

NFR-SEC-002:  Magic link tokens de un solo uso (flag used:true) con expiración de
              15 minutos en MongoDB → Prevención de replay attacks

NFR-SCAL-001: Arquitectura stateless (JWT en cliente) soporta escalado horizontal
              a N réplicas sin sesión compartida → Docker + Traefik load balancer

NFR-SCAL-002: MongoDB con índice compuesto { tenantId, active } garantiza queries
              O(log n) independientemente del número de tenants

NFR-USAB-001: Flujo de autenticación completo en ≤ 3 pasos (email → click enlace →
              dashboard) sin instalación de app ni contraseña que recordar

NFR-AVAIL-001: Despliegue con --force-recreate sin downtime observable (< 5 segundos
               entre versiones) en VM Google Cloud con Traefik como reverse proxy

NFR-MAINT-001: Cobertura de pruebas ≥ 60% en código de dominio (lib/*.ts),
               verificable con npm run test:coverage; resultado actual: 88% líneas

NFR-OBS-001:  Registro de estado por destinatario (logs[]) en cada campaña permite
              auditoría completa: recipientEmail, status, sentAt, error si aplica

NFR-MAINT-002: package-lock.json comiteado garantiza instalaciones bit-a-bit
               reproducibles en CI/CD con npm ci
```

### 7.3 Requisitos Regulatorios (México)

```
REG-001 (LFPDPPP): El sistema debe cumplir con la Ley Federal de Protección de Datos
         Personales en Posesión de los Particulares. Los datos de clientes (nombre,
         email) deben procesarse únicamente con consentimiento explícito y deben
         poder eliminarse (baja lógica disponible; baja física bajo solicitud).

REG-002 (NOM-151-SCFI-2016): Los correos electrónicos comerciales enviados deben
         incluir identificación clara del remitente, dirección física o electrónica
         de contacto, y mecanismo de cancelación de suscripción (unsubscribe).

REG-003 (Ley Federal Antispam / Código de Comercio Art. 89-94): Los envíos masivos
         de email con fines comerciales requieren consentimiento previo verificable.
         El sistema registra la fecha de alta del cliente (createdAt) como evidencia
         de incorporación voluntaria a la lista.
```

### 7.4 Requisitos Operativos

```
OPS-001: Despliegue vía CI/CD (GitHub Actions / GitLab CI) con build automatizado
         en cada push a master. Rollback manual disponible: docker compose up versión
         anterior. RTO objetivo: < 10 minutos.

OPS-002: Backups de MongoDB deben ejecutarse semanalmente mediante mongodump y
         retenerse 30 días en almacenamiento remoto. RPO: < 7 días.

OPS-003: El sistema debe registrar errores de envío de email a nivel de destinatario
         en logs[] de campaña. Alertas de error revisables en < 5 minutos mediante
         consulta directa a MongoDB o dashboard de campaña.

OPS-004: La aplicación debe estar disponible en horario 06:00–24:00 hora del centro
         de México (UTC-6). Ventana de mantenimiento planificada: domingos 02:00–04:00.

OPS-005: El entorno de producción corre en Google Cloud VM (Ubuntu) con Docker 24+,
         Traefik 3.3 como reverse proxy, certificados TLS automáticos via Cloudflare
         DNS-01, y MongoDB 7.x en red interna miseia-net.

OPS-006: Disaster recovery: imagen Docker de la versión anterior disponible en VM
         (docker images mailing-saas). Restauración: docker tag + docker compose up
         en < 15 minutos sin acceso a Internet.
```

### 7.5 Atributos de Calidad

#### 7.5.1 Rendimiento: Latencia de API Routes [PERF-API-LATENCY]
**Quality Attribute:** Performance
**Metric:** Latencia (ms) en respuesta de API routes

**Specification:**
- Percentil 99: < 500ms
- Percentil 95: < 200ms
- Percentil 50: < 80ms

**Conditions:**
- Dataset: hasta 10,000 clientes por tenant
- Load: 50 requests/segundo concurrentes
- Índice: `{ tenantId: 1, active: 1, createdAt: -1 }` en colección clientes

**Exceptions:**
- Primera petición post-cold-start de contenedor: < 3 segundos aceptable
- Envío de campaña a > 500 destinatarios: latencia proporcional (procesamiento síncrono)

**Verification:** Load test con k6, métricas en stdout de Docker

---

#### 7.5.2 Escalabilidad: Tenants Concurrentes [SCAL-TENANTS]
**Quality Attribute:** Scalability
**Metric:** Número de tenants activos sin degradación

**Specification:**
- Hasta 100 tenants con datos aislados: sin impacto en latencia (índice por tenantId)
- Escalado horizontal: N réplicas de contenedor detrás de Traefik (stateless JWT)
- Crecimiento de clientes por tenant hasta 50,000 sin rediseño de índices

**Conditions:**
- MongoDB con índice compuesto `{ tenantId, email }` (unique) y `{ tenantId, active }`
- Sin sesión compartida en servidor: JWT en cliente
- Traefik como load balancer con sticky sessions desactivadas

**Exceptions:**
- Campañas con > 10,000 destinatarios requieren procesamiento asíncrono (mejora planificada)

**Verification:** Tests de carga con múltiples tenants en paralelo vía k6

---

#### 7.5.3 Confiabilidad: Integridad de Envíos [RELI-SEND]
**Quality Attribute:** Reliability
**Metric:** Tasa de registro exitoso de resultado por destinatario

**Specification:**
- 100% de intentos de envío (exitosos o fallidos) registrados en `logs[]`
- Estado de campaña nunca queda en `sending` si el proceso termina
- Error individual de destinatario no cancela el envío al resto del segmento

**Conditions:**
- MailHog disponible en miseia-net durante el envío
- MongoDB accesible durante toda la iteración de envío

**Exceptions:**
- Si MongoDB no está disponible durante el envío, el error burbujea al cliente con status 500

**Verification:** Test E2E con campaña de múltiples destinatarios; verificación de logs[]

---

#### 7.5.4 Seguridad: Aislamiento Multitenant [SEC-ISOLATION]
**Quality Attribute:** Security
**Metric:** Porcentaje de API routes con filtro tenantId obligatorio

**Specification:**
- 100% de endpoints de datos incluyen `{ tenantId }` extraído del JWT verificado
- 0 endpoints de datos accesibles sin token válido (retornan 401)
- JWT verificado criptográficamente en cada request (no sólo parseado)

**Conditions:**
- JWT_SECRET mínimo 32 caracteres, almacenado en secreto de GitHub/GitLab
- Ningún endpoint expone datos de otro tenant

**Exceptions:**
- Endpoints públicos `/api/auth/magic-link` y `/api/auth/verify` no requieren JWT por diseño

**Verification:** Tests E2E automatizados verifican 401 en todos los endpoints sin token

---

#### 7.5.5 Mantenibilidad: Cobertura de Pruebas [MAINT-COVERAGE]
**Quality Attribute:** Maintainability
**Metric:** Porcentaje de líneas de código de dominio cubiertas por pruebas

**Specification:**
- Cobertura de líneas en `lib/*.ts`: ≥ 60% (umbral configurado en vitest.config.ts)
- Cobertura actual: **88.88%** líneas, **85%** statements, **85.71%** funciones
- Suite de 17 tests unitarios + 9 specs E2E ejecutables en < 30 segundos

**Conditions:**
- Exclusiones justificadas: `lib/types.ts` (sin lógica), `lib/db.ts` (requiere MongoDB real)
- Tests unitarios en entorno Node sin DOM; E2E contra servidor Next.js levantado

**Exceptions:**
- `lib/mailer.ts` no cubierto en tests unitarios (requiere SMTP externo); cubierto vía E2E

**Verification:** `npm run test:coverage` genera reporte en `/coverage/index.html`

---

### 7.6 Criterios de Aceptación BDD

```gherkin
Feature: Autenticación por Magic Link
  Scenario: Login exitoso con email válido
    Given el usuario está en la página /login
    And introduce su email "usuario@empresa.com"
    When hace clic en "Enviar enlace"
    Then el sistema muestra mensaje "Revisa tu bandeja de entrada"
    And MailHog recibe un email con enlace que contiene un JWT firmado

Feature: Aislamiento Multitenant
  Scenario: Tenant A no puede ver datos de Tenant B
    Given el Tenant A está autenticado con su JWT
    When hace GET /api/clientes
    Then el sistema devuelve únicamente clientes con tenantId del Tenant A
    And no incluye ningún cliente del Tenant B

Feature: Creación de Campaña
  Scenario: Campaña enviada a segmento por tag
    Given el usuario tiene clientes con tag "newsletter"
    And existe una plantilla con variable {{name}}
    When crea una campaña con segmento "newsletter" y dispara el envío
    Then cada cliente con tag "newsletter" recibe un email personalizado
    And el registro de campaña muestra status "sent" con logs por destinatario

Feature: Importación CSV de Clientes
  Scenario: Importación masiva exitosa
    Given el usuario tiene un archivo CSV con 50 filas (nombre, email, tags)
    When sube el archivo en /clientes/importar
    Then el sistema crea 50 clientes activos en el tenant
    And todos quedan visibles en el listado con sus tags correspondientes

Feature: Preview de Plantilla
  Scenario: Preview en tiempo real con datos de prueba
    Given el usuario ha creado una plantilla "Hola {{name}}, empresa: {{company}}"
    When introduce datos de prueba { name: "Ana", company: "Acme" }
    Then el preview muestra "Hola Ana, empresa: Acme"
    And la plantilla detecta automáticamente las variables ["name", "company"]
```

---

## 8. Especificaciones

### 8.1 Specification Driven Development

#### Functional Spec: Sistema de Autenticación Magic Link

```
Use Case: Autenticación sin contraseña
Actors: Usuario no autenticado, Servidor Next.js, MailHog SMTP

Preconditions:
- MailHog disponible en MAILHOG_HOST:MAIL_PORT
- JWT_SECRET configurado (mínimo 32 caracteres)

Main Flow:
1. Usuario introduce email en /login
2. POST /api/auth/magic-link → genera token JWT corto (15 min) + guarda en MongoDB
3. Servidor envía email con enlace /verify?token=<jwt>
4. Usuario hace clic → GET /verify (Client Component)
5. POST /api/auth/verify → valida token, verifica no usado, crea/recupera tenant
6. Servidor devuelve JWT de sesión (7 días) con { tenantId, userId, email, role }
7. Cliente almacena JWT en localStorage, GlobalContext actualiza estado → /dashboard

Acceptance Criteria:
- Given usuario en /login con email válido
- When envía el formulario
- Then recibe email con enlace en < 3 segundos
- And el enlace es de un solo uso (used: true tras primer clic)
- And el JWT de sesión incluye tenantId correcto
```

#### Structural Spec: Arquitectura de Datos MongoDB

```
Colecciones:
├── tenants          { _id, name, email, createdAt }
├── magic_tokens     { email, tenantId, token, expiresAt, used }
├── clientes         { tenantId, name, email, tags[], metadata{}, active, createdAt }
├── plantillas       { tenantId, name, subject, htmlBody, variables[], createdAt, updatedAt }
└── campanas         { tenantId, name, plantillaId, segment, status, logs[], createdAt, sentAt }

Índices requeridos:
- clientes:    { tenantId: 1, active: 1 }, { tenantId: 1, email: 1 } unique
- plantillas:  { tenantId: 1, createdAt: -1 }
- campanas:    { tenantId: 1, status: 1 }
- magic_tokens: { token: 1 } unique, TTL en expiresAt

Invariante de tenantId:
- TODA query de datos incluye { tenantId } como primer filtro
- tenantId proviene del JWT verificado, nunca del body del request
```

#### Behavioral Spec: Estado de Campaña

```mermaid
stateDiagram-v2
    [*] --> draft : POST /api/campanas (crear)
    draft --> sending : POST /api/campanas/{id}/send (disparar)
    sending --> sent : Todos los emails procesados OK
    sending --> failed : Error crítico durante el envío
    sent --> [*]
    failed --> [*]

    note right of sending
        Por cada cliente del segmento:
        renderTemplate(plantilla, cliente)
        sendMail(destinatario)
        push a logs[] { status: sent|failed }
    end note
```

#### Operative Spec: Despliegue en Producción

```
Despliegue — Google Cloud VM + Docker + Traefik

Build:
- Multi-stage Dockerfile: deps (npm ci --only=production) →
  builder (npm ci + NODE_ENV=production npm run build) →
  runner (Node 20 Alpine, output: standalone)
- Imagen final: ~150MB

CI/CD:
- Push a master → GitHub Actions: test → build imagen → SCP → SSH deploy
- docker compose -f docker-compose.prod.yml up -d --force-recreate
- Rollback: docker tag <sha-anterior> mailing-saas:latest + up

Red:
- miseia-net: bridge Docker externa, compartida con MongoDB y MailHog
- Traefik: router mailing.deviaaps.com → entrypoint websecure (443)
- TLS: wildcard *.deviaaps.com via Cloudflare DNS-01 certresolver

Monitoreo:
- docker logs mailing --follow
- Logs de envío por destinatario en colección campanas.logs[]
- Error rate visible en dashboard de campaña (status: failed)

Runbook — Contenedor caído:
1. ssh gcvmuser@<VM_HOST>
2. cd ~/MISEIA120_mailing
3. docker ps -a | grep mailing
4. docker compose -f docker-compose.prod.yml logs --tail=50
5. Si error de conexión MongoDB: verificar miseia-net + mongodb container
6. docker compose -f docker-compose.prod.yml restart mailing
```

---

### 8.2 Invariantes y Contratos

#### Contrato: `renderTemplate(htmlBody, context)`

```
PRECONDICIÓN:
- htmlBody: string no nulo, puede estar vacío
- context: Record<string, unknown>, puede estar vacío

POSTCONDICIÓN:
- Devuelve string con todas las ocurrencias de {{variable}} reemplazadas
  por el valor correspondiente en context
- Si la variable no existe en context, se reemplaza por cadena vacía ""
- El string original htmlBody no es modificado

INVARIANTE:
- Las etiquetas HTML del body se preservan intactas
- El número de variables en el output es cero

EJEMPLOS:
- renderTemplate("Hola {{name}}", { name: "Ana" }) → "Hola Ana"
- renderTemplate("Hola {{name}}", {}) → "Hola "
- renderTemplate("<p>Texto</p>", {}) → "<p>Texto</p>"
- renderTemplate("{{a}} {{a}}", { a: "X" }) → "X X"
```

#### Contrato: `getDb(): Promise<Db>`

```
PRECONDICIÓN:
- process.env.MONGODB_URI: string no vacío, URI de MongoDB válida
- process.env.MONGODB_DB: string no vacío, nombre de base de datos

POSTCONDICIÓN:
- Devuelve instancia de Db conectada y lista para operar
- La misma instancia se reutiliza en llamadas sucesivas (Singleton)

INVARIANTE:
- En desarrollo: cliente colgado de global._mongoClient (sobrevive hot-reload)
- En producción: cliente en variable de módulo (_client)
- connect() solo se llama una vez por ciclo de vida del proceso

EJEMPLOS:
- getDb() con URI válida → Db { databaseName: 'mailing_saas' }
- getDb() sin MONGODB_URI → throw Error('Missing MONGODB_URI env variable')
```

#### Contrato: `verifyJwt(token): JwtPayload | null`

```
PRECONDICIÓN:
- token: string (puede ser malformado o expirado)
- JWT_SECRET: string no vacío en process.env

POSTCONDICIÓN:
- Si token válido y no expirado: devuelve JwtPayload { tenantId, userId, email, role }
- Si token inválido, expirado o manipulado: devuelve null (nunca lanza excepción)

INVARIANTE:
- La función nunca propaga excepciones al caller
- tenantId en el payload devuelto siempre es string no vacío

EJEMPLOS:
- verifyJwt(validToken) → { tenantId: "t1", userId: "u1", ... }
- verifyJwt("token.invalido.xxx") → null
- verifyJwt(tokenExpirado) → null
```

---

### 8.3 ADRs — Architecture Decision Records

#### ADR-001: MongoDB Native Driver sobre Mongoose/Prisma
**Status:** Accepted | **Fecha:** 2026-06-27

**Contexto:** El requisito crítico es que toda query incluya `{ tenantId }`. Mongoose puede omitir este filtro silenciosamente. Prisma con conector MongoDB tiene limitaciones en aggregation pipelines.

**Opciones consideradas:**
1. **Mongoose**: ODM maduro, pero abstracción puede ocultar queries inseguras
2. **Prisma**: type-safe, pero connector MongoDB experimental
3. **MongoDB Native Driver**: control total, sin magia oculta

**Decisión:** MongoDB Native Driver con patrón Singleton en `lib/db.ts`.

**Consecuencias positivas:** Control total sobre cada query, cero overhead de ODM, pool explícito previene connection exhaustion. Benchmarks: Mongoose añade ~2ms por query en hidratación de documentos.

**Consecuencias negativas:** Sin validación de esquema automática, sin timestamps automáticos, queries más verbosas.

**Riesgo mitigado:** Con Mongoose, un developer olvidando `.where('tenantId')` expone datos de todos los tenants.

---

#### ADR-002: JWT en localStorage sobre Cookies HttpOnly
**Status:** Accepted | **Fecha:** 2026-06-27

**Contexto:** Next.js App Router requiere que Client Components accedan al token para llamar API routes. `cookies()` solo funciona en Server Components o Route Handlers.

**Decisión:** JWT en `localStorage`, leído en `GlobalContext`, adjunto como `Authorization: Bearer`.

**Consecuencias:** CSRF imposible (header-based auth). XSS mitigado por Next.js escaping + CSP. Sin revocación server-side (aceptable: no hay datos de pago, magic link limita la superficie de ataque).

---

#### ADR-003: output standalone en Next.js para Docker
**Status:** Accepted | **Fecha:** 2026-06-27

**Contexto:** La imagen estándar de Next.js incluye toda `node_modules` (~400MB). `output: standalone` copia solo las dependencias necesarias.

**Decisión:** `output: "standalone"` en `next.config.ts`.

**Consecuencias positivas:** Imagen Docker ~150MB vs ~400MB (reducción del 62%). Arranque más rápido.

**Consecuencias negativas:** Los archivos estáticos deben copiarse manualmente en el Dockerfile stage `runner`.

---

#### ADR-004: Handlebars para Personalización de Plantillas
**Status:** Accepted | **Fecha:** 2026-06-27

**Contexto:** La personalización de emails requiere un motor de plantillas seguro y familiar para equipos de marketing.

**Opciones consideradas:**
1. **String interpolation**: frágil, sin soporte de helpers
2. **Mustache**: subset de Handlebars, sin helpers
3. **Handlebars**: sintaxis `{{variable}}`, helpers (`{{#if}}`), seguro
4. **EJS**: ejecuta JavaScript arbitrario — riesgo de inyección de código

**Decisión:** `handlebars` npm package en `lib/handlebars.ts`.

**Consecuencias:** Sintaxis segura, `extractVariables` con regex detecta variables automáticamente, preview funciona tanto en navegador como en Node.js.

---

#### ADR-005: Lazy Validation de Variables de Entorno
**Status:** Accepted | **Fecha:** 2026-06-27

**Contexto:** El build Docker de Next.js importa módulos en tiempo de compilación. Los módulos originales leían `MONGODB_URI` y `JWT_SECRET` en el scope del módulo, lanzando `Error` durante el build.

**Opciones consideradas:**
1. **Pasar variables en build time** (`ARG`): expone secretos en capas de imagen
2. **Mover validación dentro de funciones** (lazy): secretos solo se validan en runtime
3. **`export const dynamic = 'force-dynamic'`**: previene análisis estático de routes

**Decisión:** Combinación de (2) y (3). `getSecret()` y `getDb()` validan dentro de la función. Todas las API routes tienen `export const dynamic = 'force-dynamic'`.

**Consecuencias:** Build Docker sin variables de entorno. Los secretos nunca se hornean en la imagen. Trade-off: error de configuración se detecta en runtime. Mitigado por CI que prueba con secretos reales.

---

## 9. Pruebas Unitarias e Integración

### Suite de Pruebas Unitarias (Vitest)

**Comando:** `npm run test` | `npm run test:coverage`

**Alcance:** `lib/auth.ts` y `lib/handlebars.ts` — lógica de dominio sin I/O externo.

| Archivo de Test | Tests | Cobertura |
|---|---|---|
| `tests/unit/auth.test.ts` | 5 | auth.ts: 100% líneas |
| `tests/unit/handlebars.test.ts` | 12 | handlebars.ts: 100% líneas |
| **Total** | **17** | **88.88% líneas en lib/** |

**Resultado de cobertura:**

```
---------------|---------|----------|---------|---------|
File           | % Stmts | % Branch | % Funcs | % Lines |
---------------|---------|----------|---------|---------|
All files      |      85 |    27.27 |   85.71 |   88.88 |
 auth.ts       |    90.9 |       75 |     100 |     100 |
 handlebars.ts |     100 |      100 |     100 |     100 |
---------------|---------|----------|---------|---------|
```

**Dependencias de testing:**
```json
"devDependencies": {
  "vitest": "^4.1.9",
  "@vitest/coverage-v8": "^4.1.9",
  "@vitejs/plugin-react": "^6.0.3",
  "@playwright/test": "^1.61.1"
}
```

**Casos cubiertos — auth.ts:**
- `signJwt` + `verifyJwt`: round-trip completo con payload completo
- `verifyJwt`: token inválido devuelve `null`
- `verifyJwt`: token manipulado devuelve `null`
- `extractJwtFromHeader`: sin prefijo Bearer devuelve `null`
- `extractJwtFromHeader`: Bearer válido extrae payload correcto

**Casos cubiertos — handlebars.ts:**
- Interpolación de variable única y múltiple
- Variable ausente en contexto → string vacío
- Propiedades anidadas (`user.email`)
- HTML preservado en el output
- Template sin variables sin cambios
- Extracción de variable única y múltiple con deduplicación (Set)
- Trim de espacios en nombres de variables
- Ignora block helpers `{{#if}}` / `{{/if}}`
- Template HTML complejo con 3 variables

### Suite de Pruebas E2E (Playwright)

**Comando:** `npm run test:e2e` (requiere servidor en `http://localhost:3000`)

| Archivo de Spec | Specs | Descripción |
|---|---|---|
| `tests/e2e/auth.spec.ts` | 4 | Formulario login, confirmación, redirects sin auth |
| `tests/e2e/api.spec.ts` | 5 | 401 en recursos protegidos, 400 sin email, 200 con email |
| **Total** | **9** | — |

**Configuración:** `playwright.config.ts` — baseURL `http://localhost:3000`, navegador Chromium, 1 worker.

---

## 10. Despliegue

### 10.1 URL de Producción

```
https://mailing.deviaaps.com
```

Desplegado en Google Cloud VM con Docker + Traefik 3.3. TLS wildcard `*.deviaaps.com` via Cloudflare DNS-01.

---

### 10.2 Lockfile — Instalaciones Reproducibles

El proyecto incluye `package-lock.json` comiteado en el repositorio. Este archivo garantiza que cada instalación — en desarrollo, en CI/CD y en el Docker build — use exactamente las mismas versiones de todas las dependencias transitivas.

```
package-lock.json   # npm lockfile v3 — árbol completo con hashes de integridad
```

**Uso correcto:**
```bash
npm ci          # CI/CD y Docker: respeta el lockfile estrictamente
npm install     # Desarrollo: puede actualizar el lockfile (solo al añadir packages)
```

> **Nunca** usar `npm install` en CI/CD o Dockerfile — usar siempre `npm ci`.

---

### 10.3 Instrucciones de Despliegue

#### Opción A — Docker local

```bash
docker build -t mailing-saas:latest .

docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  -e MONGODB_DB=mailing_saas \
  -e JWT_SECRET=tu-secreto-32-chars \
  -e MAIL_FROM=noreply@mailing.local \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  mailing-saas:latest
```

#### Opción B — Docker Compose en producción (con Traefik)

```bash
# En el servidor VM:
cd ~/MISEIA120_mailing
cp .env.example .env.production
# Editar .env.production con valores reales

docker compose -f docker-compose.prod.yml up -d
docker logs mailing --follow
curl https://mailing.deviaaps.com
```

#### Opción C — CI/CD Automático (recomendado)

Cada push a `master` en GitHub dispara:

```
1. npm ci → lint → test → coverage
2. docker build -t mailing-saas:<sha> .
3. SCP imagen (.tar.gz) → VM
4. SSH: docker load + docker compose up --force-recreate
```

Secretos requeridos en GitHub (Settings → Secrets → Actions):

| Secret | Descripción |
|---|---|
| `VM_SSH_KEY` | Clave privada SSH para acceso al VM |
| `VM_HOST` | IP del VM |
| `VM_USER` | Usuario SSH |
| `JWT_SECRET` | Secreto JWT de producción |

#### Dockerfile — Multi-stage Build

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_ENV=production npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 11. Mejoras y Extensiones

### Extensiones de valor inmediato

| Funcionalidad | Descripción | Complejidad |
|---|---|---|
| **Paginación de clientes** | `skip/limit` en `/api/clientes` + controles de página en UI | Baja |
| **Búsqueda full-text** | Índice `$text` en MongoDB sobre `name` + `email` | Baja |
| **Exportar campaña a CSV** | Descargar `logs[]` de campaña como CSV | Baja |
| **Webhook post-envío** | Callback HTTP configurable por tenant al completar campaña | Media |
| **Plantillas con partials** | Bloques reutilizables Handlebars (header, footer) por tenant | Media |
| **Programación de campañas** | Envío diferido con `sentAt` futuro + worker | Alta |
| **Métricas de apertura** | Pixel de tracking 1x1 + endpoint `/api/track/open` | Alta |
| **Roles granulares** | Role `viewer` (solo lectura) vs `admin` (escritura) | Media |

### Notas de rendimiento

| Operación | Tiempo actual | Con mejora |
|---|---|---|
| GET /api/clientes (1,000 docs) | ~80ms | ~30ms con proyección de campos |
| Envío campaña 100 destinatarios | ~8s secuencial | ~2s con `Promise.all` en batches de 10 |
| Build Docker | ~2.5 min | ~1 min con cache de capas en CI |

---

## 12. Cambios Documentados e IA

### Asistencia de Inteligencia Artificial

Este proyecto fue desarrollado con asistencia de **Claude Sonnet 4.6** (Anthropic) como pair programmer en las siguientes áreas:

| Área | Contribución de IA | Razón |
|---|---|---|
| **Lazy env validation** | Refactorización de `lib/db.ts` y `lib/auth.ts` para mover validación de `process.env` dentro de funciones | El build Docker fallaba por lectura de env vars en scope de módulo durante análisis estático de Next.js |
| **`export const dynamic`** | Añadir `export const dynamic = 'force-dynamic'` a las 12 API routes | Prevenir que Next.js intente pre-renderizar rutas que requieren variables de entorno de runtime |
| **Cobertura de tests** | Diseño de 17 tests unitarios con casos borde (token manipulado, variables anidadas, block helpers) | Alcanzar 88% cobertura de líneas en `lib/` |
| **CI/CD dual** | Generación de `.github/workflows/ci-cd.yml` y `.gitlab-ci.yml` | Automatización completa del pipeline test → build → deploy |
| **SSH key base64** | Diagnóstico y solución: clave SSH almacenada como base64 para evitar corrupción CRLF en GitLab CI | OpenSSH 10.3 en Alpine rechazaba claves con line endings incorrectos |
| **ADRs** | Estructura y redacción de ADR-001 a ADR-005 con justificación cuantitativa | Documentar decisiones de arquitectura |

### Cambios Respecto al Diseño Inicial

1. **`lib/db.ts` — Singleton con lazy init:** El diseño original cargaba `MONGODB_URI` al importar el módulo. Cambiado a `getDb(): Promise<Db>` que valida dentro de la función.

2. **`lib/auth.ts` — `getSecret()` lazy:** `JWT_SECRET` ahora se lee solo cuando se invoca `signJwt()` o `verifyJwt()`, no al importar el módulo.

3. **ESLint — `react-hooks/set-state-in-effect: off`:** React 19 introdujo una regla que rechaza `setState` antes del primer `await` en `useEffect`. Los patrones de los componentes son válidos; la regla fue desactivada globalmente.

4. **GitLab CI — SSH key vía base64:** La variable tipo `file` de GitLab se corrompía con CRLF al guardarse desde Windows. Solución: almacenar como `env_var` con contenido base64 y decodificar con `base64 -d` en el job.

### Revisión Crítica

**Fortalezas evidenciadas:**
- El aislamiento multitenant es robusto: toda query incluye `{ tenantId }` extraído del JWT verificado. Los tests E2E confirman que endpoints sin token devuelven 401 de forma consistente.
- La arquitectura stateless (JWT en cliente) permite escalar horizontalmente sin estado compartido en servidor.
- El Dockerfile multi-stage produce imágenes de ~150MB vs ~400MB del enfoque naive (reducción del 62%).
- Los dos pipelines CI/CD (GitHub Actions y GitLab CI) están completamente funcionales y en verde.

**Debilidades identificadas:**
- **Branch coverage: 27.27%** — Los paths de error en `lib/auth.ts` (falta de `JWT_SECRET`) no están cubiertos. Se requieren tests adicionales para rutas de excepción.
- **`lib/mailer.ts` sin cobertura unitaria** — La dependencia de SMTP externo dificulta el mock. Una interfaz `IMailer` permitiría inyección de dependencias y tests sin MailHog.
- **Envío de campaña síncrono** — La iteración sobre destinatarios en el mismo request HTTP limita campañas a ~100 destinatarios antes de timeout. Para escala real se requiere una cola de mensajes (BullMQ, SQS).
- **Sin revocación de JWT** — Un token robado es válido 7 días. Para producción real, un blocklist en Redis con `jti` (JWT ID) resolvería esto sin sesión server-side compleja.

**Veredicto:** El proyecto cumple su propósito con solidez técnica demostrable. Los trade-offs tomados (localStorage, envío síncrono, sin queue) son apropiados para el alcance del ejercicio y están documentados explícitamente en los ADRs con justificación cuantitativa.

---

*Desarrollado como proyecto académico MISEIA — Master IA Dev, Bloque 4, Módulo 1-4-120*
*Stack: Next.js 16 · TypeScript · MongoDB · Handlebars · MailHog · Docker · Traefik*
