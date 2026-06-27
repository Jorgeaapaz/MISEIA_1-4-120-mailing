# ADR-001: MongoDB Native Driver over Mongoose/Prisma

**Date:** 2026-06-27  
**Status:** Accepted

## Context

The project requires MongoDB as the database layer for a multitenant SaaS. The key constraint is that **every query must include `{ tenantId }` as a filter** — there is no safe default. Three options were evaluated: MongoDB native driver, Mongoose (ODM), and Prisma (ORM with MongoDB connector).

The application runs on Next.js App Router where Server Components and API routes both need database access. Connection management in a serverless-like environment (Next.js dev mode hot-reloads destroy module state) requires explicit pool management.

## Decision

Use the **MongoDB native driver** (`mongodb` npm package) with a **Singleton MongoClient** pattern in `lib/db.ts`. A module-level Promise caches the connected client across requests.

```ts
// lib/db.ts — single shared client
let client: MongoClient
let clientPromise: Promise<MongoClient>
// ...module-level caching logic
```

## Consequences

**Positive:**
- Full control over every query — no hidden abstraction that could silently omit `{ tenantId }`.
- No ODM schema definition overhead; `lib/types.ts` TypeScript interfaces serve as the schema contract.
- Singleton pool survives across Next.js API route invocations, preventing connection exhaustion.
- Zero runtime overhead from ODM middleware or model hydration.

**Negative / Trade-offs:**
- No automatic schema validation at the ODM level — relies on TypeScript types and API-layer validation only.
- Slightly more verbose queries compared to `Model.find()` syntax.
- No automatic `createdAt`/`updatedAt` timestamps — must be set manually on insert.

**Risks mitigated:**
- Mongoose's default behavior of not enforcing `tenantId` in queries was identified as a risk. With the native driver, every query is explicit and auditable.
