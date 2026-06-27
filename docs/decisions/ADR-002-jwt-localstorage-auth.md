# ADR-002: JWT Stored in localStorage over HttpOnly Cookie Sessions

**Date:** 2026-06-27  
**Status:** Accepted

## Context

The application needs to carry authentication state (`tenantId`, `userId`, `email`, `role`) across Client Components and API route calls. Two primary approaches exist: (1) JWT in `localStorage` accessed by JavaScript, and (2) HttpOnly session cookies managed by the server.

The project uses Next.js App Router. Client Components call API routes via `fetch` and need to attach the token manually. Server Components access the DB directly and do not need a token in the HTTP layer. There is no server-side session store.

## Decision

Store the JWT in **`localStorage`**, read it in `GlobalContext` on mount, and attach it as `Authorization: Bearer <token>` on every API fetch call.

## Consequences

**Positive:**
- No server-side session storage required — stateless authentication at zero infrastructure cost.
- `GlobalContext` makes the token accessible to any Client Component without prop drilling.
- Straightforward to implement with Next.js App Router where `cookies()` requires Server Component or Route Handler context.
- 7-day JWT expiry matches magic link usage patterns (infrequent logins).

**Negative / Trade-offs:**
- Exposed to XSS: if malicious script runs in the browser, it can read the token. Mitigated by: strict CSP, no `dangerouslySetInnerHTML` usage, and Next.js built-in XSS escaping.
- No server-side revocation — a stolen token is valid until expiry. Acceptable risk given: tokens contain no payment data, and magic links already limit the attack surface (attacker needs email access to authenticate).
- Not accessible in Server Components — they query MongoDB directly using `tenantId` from the route params, not the token.

**Risks mitigated:**
- CSRF attacks are not possible against `Authorization: Bearer` header-based auth (CSRF only affects cookie-based auth).
