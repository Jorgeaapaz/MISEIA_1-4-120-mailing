# ADR-004: Handlebars for Email Template Engine

**Date:** 2026-06-27  
**Status:** Accepted

## Context

The platform allows tenants to create reusable email templates with variable interpolation (e.g., `{{name}}`, `{{company}}`). Variables are resolved per-recipient at campaign send time using the client's data as context. Alternatives evaluated: Mustache, EJS, Nunjucks, and plain string interpolation.

Key requirements: (1) variable extraction from template source for the `variables[]` metadata field, (2) logic-less syntax safe for non-technical users, (3) active npm ecosystem.

## Decision

Use **Handlebars** (`handlebars` npm package) via `lib/handlebars.ts`. Templates compile once per call and execute with the recipient's client data as context. Variables are extracted with a regex matching `{{varName}}` patterns.

## Consequences

**Positive:**
- Logic-less by default — tenants cannot inject server-side code through template syntax.
- `Handlebars.compile()` separates compilation from execution, enabling future caching of compiled templates by template ID.
- `extractVariables()` regex is simple and reliable for the `{{var}}` pattern — no parser needed.
- Widely used for email templating; good documentation and community support.

**Negative / Trade-offs:**
- Handlebars adds ~40 KB to the bundle (server-side only, not sent to browser).
- Does not support async helpers natively — acceptable since all context data is synchronously available from MongoDB before render.
- EJS would allow more powerful template logic, but that power is a security risk in a multitenant context where tenants supply the template source.

**Risks mitigated:**
- Mustache was rejected because it lacks the `compile()` / `execute()` separation needed for future template caching.
- Plain string interpolation (`str.replace()`) was rejected because it cannot handle nested objects (`{{client.metadata.company}}`) or missing variables gracefully.
