# Mailing SaaS — Multitenant Email Campaign Platform

A **Next.js 16 + TypeScript** SaaS application that lets multiple tenants manage clients, create Handlebars email templates, and send personalised bulk email campaigns — all tracked per recipient, with zero-password authentication via magic links.

---

## Features Implemented

### 1. Magic Link Authentication
Passwordless login: the user enters their email, receives a signed JWT link via MailHog, and on click is issued a 7-day JWT stored in `localStorage`. The token includes `tenantId`, `userId`, `email`, and `role`. All API routes extract and verify this token; routes with missing or invalid tokens return `401`.

### 2. Client Management (CRUD + CSV Import)
Full CRUD for tenant clients with fields `name`, `email`, `tags[]`, `metadata{}`, `active`, and `createdAt`. Clients are never deleted physically — setting `active: false` is a soft-delete. The list view supports real-time search by name/email and tag filtering. Bulk import accepts a CSV file (columns: name, email, tags).

### 3. Email Template Editor
Templates store `name`, `subject`, `htmlBody`, and an auto-extracted `variables[]` array. The body uses Handlebars syntax (`{{variable}}`). A live preview renders the template with sample data, and a test-send button delivers the rendered HTML to any address via MailHog.

### 4. Campaign Sending
A campaign links a template to a client segment (all clients or filtered by tag). On send, each client's data is used as a Handlebars context, the email is rendered per-recipient, and delivery is logged with `status: 'sent' | 'failed'`, `sentAt`, and optional `error`. Campaign state transitions: `draft → sending → sent | failed`.

### 5. Multi-Tenant Isolation
Every MongoDB document carries a `tenantId`. Every query — whether from a Server Component or an API route — always includes `{ tenantId }` as a filter. The tenant is resolved from the JWT; there is no way to access another tenant's data without a valid token for that tenant.

---

## Project Structure

```
mailing/
├── app/
│   ├── layout.tsx                     # Root layout: Geist fonts, GlobalProvider
│   ├── page.tsx                       # Redirects to /login
│   ├── login/page.tsx                 # Magic link entry form
│   ├── verify/page.tsx                # Validates token & stores JWT
│   ├── dashboard/
│   │   ├── layout.tsx                 # AuthGuard wrapper + DashboardNav sidebar
│   │   └── page.tsx                   # Stats: clients, templates, campaigns, emails sent
│   ├── clientes/
│   │   ├── page.tsx                   # List with search & tag filter
│   │   ├── nuevo/page.tsx             # Create client form
│   │   ├── [id]/page.tsx              # Edit client
│   │   └── importar/page.tsx          # CSV bulk import
│   ├── plantillas/
│   │   ├── page.tsx                   # Template card grid
│   │   ├── nueva/page.tsx             # Create template
│   │   ├── [id]/page.tsx              # Edit template (Handlebars editor)
│   │   └── [id]/preview/page.tsx      # Live HTML preview with variable injection
│   ├── campanas/
│   │   ├── page.tsx                   # List campaigns with send/delete actions
│   │   ├── nueva/page.tsx             # Create campaign (template + segment picker)
│   │   └── [id]/page.tsx              # Campaign detail & per-recipient delivery log
│   └── api/
│       ├── auth/
│       │   ├── magic-link/route.ts    # POST: generate & email magic link
│       │   └── verify/route.ts        # GET: verify token, issue JWT
│       ├── clientes/
│       │   ├── route.ts               # GET (search/filter) / POST
│       │   ├── [id]/route.ts          # GET / PUT / DELETE (soft)
│       │   └── import/route.ts        # POST: parse & bulk-insert CSV
│       ├── plantillas/
│       │   ├── route.ts               # GET / POST
│       │   ├── [id]/route.ts          # GET / PUT / DELETE
│       │   ├── [id]/preview/route.ts  # GET: Handlebars render → HTML
│       │   └── [id]/test-send/route.ts# POST: send test email via MailHog
│       └── campanas/
│           ├── route.ts               # GET / POST
│           ├── [id]/route.ts          # GET / PUT / DELETE
│           └── [id]/send/route.ts     # POST: fan-out send to segment
├── components/
│   ├── AuthGuard.tsx                  # Redirects unauthenticated users to /login
│   └── DashboardNav.tsx              # Sidebar with links & logout
├── context/
│   └── GlobalContext.tsx             # Auth state: token, tenantId, user info
├── lib/
│   ├── auth.ts                        # signJwt / verifyJwt / extractTenant
│   ├── db.ts                          # Singleton MongoClient (connection pool)
│   ├── handlebars.ts                  # renderTemplate + extractVariables
│   ├── mailer.ts                      # Nodemailer transport → MailHog
│   └── types.ts                       # All TypeScript interfaces (no `any`)
├── scripts/
│   └── seed.ts                        # Seeds a demo tenant with clients & templates
├── .env.local                         # Local environment variables
├── next.config.ts                     # Next.js configuration
└── tsconfig.json                      # TypeScript strict mode, path alias @/*
```

---

## Design Patterns / Architecture

| Pattern | Where |
|---|---|
| **Singleton** | `lib/db.ts` — one `MongoClient` instance shared via a module-level promise; prevents connection pool exhaustion under concurrent requests. |
| **Repository / Data Access Object** | All DB access is funnelled through API routes that always attach `{ tenantId }` — no inline `MongoClient` creation anywhere else. |
| **Context / Provider** | `GlobalContext` wraps the whole app; any component can read `user`, `token`, or call `logout()` without prop drilling. |
| **Guard / Wrapper Component** | `AuthGuard` reads the token on mount and immediately redirects to `/login` if absent or expired, before the protected page renders. |
| **Template Method (Handlebars)** | `lib/handlebars.ts` compiles templates once and applies per-recipient context; `extractVariables` parses `{{var}}` patterns to populate the `variables[]` metadata field. |
| **Strategy — segment selection** | The campaign send route applies an inline strategy: `segment === 'all'` queries all active clients; otherwise it queries `{ tags: segment }`. Adding a new segment type requires only a new branch in that route. |

---

## How It Works

1. **Auth**: A user submits their email → `POST /api/auth/magic-link` persists a short-lived token in MongoDB and sends a link via MailHog → the user clicks the link → `GET /api/auth/verify` validates the token, creates the tenant if new, issues a signed JWT → the client stores it in `localStorage` and `GlobalContext`.
2. **Template & Send**: The user creates a Handlebars template, optionally previews it, then creates a campaign that pairs it with a client segment. `POST /api/campanas/[id]/send` iterates recipients, calls `renderTemplate(htmlBody, clientData)`, sends via Nodemailer, and appends a log entry (`sent` or `failed`) to the campaign document.

```typescript
// lib/handlebars.ts — core render call
import Handlebars from 'handlebars';

export function renderTemplate(htmlBody: string, context: Record<string, unknown>): string {
  const compiled = Handlebars.compile(htmlBody);
  return compiled(context);
}

// Used in /api/campanas/[id]/send/route.ts
const html = renderTemplate(plantilla.htmlBody, {
  name: cliente.name,
  email: cliente.email,
  ...cliente.metadata,
});
await sendMail({ to: cliente.email, subject: plantilla.subject, html });
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20 LTS or later |
| MongoDB | 7.x (local or Atlas) |
| MailHog | latest (local SMTP trap) |

### Clone

```bash
git clone https://github.com/Jorgeaapaz/MISEIA_1-4-120-mailing.git
cd MISEIA_1-4-120-mailing
```

### Install dependencies

```bash
npm install
```

### Environment variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=mailing_saas

MAILHOG_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@mailing.local

JWT_SECRET=change-me-to-a-long-random-secret
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### Start MailHog

```bash
# Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# macOS (Homebrew)
brew install mailhog && mailhog
```

MailHog web UI: [http://localhost:8025](http://localhost:8025)

### Seed demo data (optional)

```bash
npx ts-node scripts/seed.ts
```

### Run development server

```bash
npm run dev
# Open http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

---

## Example Output

### Login flow

```
POST /api/auth/magic-link
Body: { "email": "demo@example.com" }

→ 200 { "message": "Magic link sent" }
→ MailHog receives: "Click here to log in: http://localhost:3000/verify?token=eyJ..."
```

### Template preview

```
GET /api/plantillas/664f.../preview?name=Ana&company=Acme

→ 200 Content-Type: text/html
→ "<h1>Hola Ana,</h1><p>Bienvenida a Acme...</p>"
```

### Campaign send — success & partial failure

```
POST /api/campanas/665a.../send

→ 200 {
  "sent": 42,
  "failed": 1,
  "logs": [
    { "recipientEmail": "ok@example.com",   "status": "sent",   "sentAt": "2026-05-20T10:00:00Z" },
    { "recipientEmail": "bad@nodomain.xyz", "status": "failed", "error": "Connection refused" }
  ]
}
```

### Unauthorized access

```
GET /api/clientes
(no Authorization header)

→ 401 { "error": "Token requerido" }
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS 4 |
| Database | MongoDB 7.2 (native driver, connection pool) |
| Auth | JWT (`jsonwebtoken`) — magic link, no passwords |
| Email | Nodemailer → MailHog (local) |
| Templating | Handlebars 4.7 |
| Runtime | Node.js 20 LTS |
