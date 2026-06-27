# ADR-003: Passwordless Magic Link Authentication

**Date:** 2026-06-27  
**Status:** Accepted

## Context

The product serves small-to-medium businesses managing email campaigns. Users log in infrequently (campaign creation, not daily tasks). The alternatives evaluated were: password + bcrypt, OAuth (Google/GitHub), and magic link (token sent via email).

The infrastructure includes MailHog for local email testing, making email delivery a first-class concern. The multitenant model means a new tenant is provisioned on first login — there is no separate signup flow.

## Decision

Implement **passwordless magic link authentication**: the user submits their email, a signed short-lived token is stored in MongoDB and emailed via MailHog/Nodemailer. On click, `GET /api/auth/verify` validates the token, creates the tenant on first visit, and issues a 7-day JWT.

## Consequences

**Positive:**
- Eliminates password storage, hashing (bcrypt), reset flows, and brute-force protection entirely — substantial security surface reduction.
- First-time tenant provisioning is seamless: no separate "create account" step.
- MailHog integration is already required for campaign sending — magic links reuse the same transport with zero additional infrastructure.
- Magic link tokens expire in 15 minutes and are single-use (`used: true` after consumption) — limiting replay attack window.

**Negative / Trade-offs:**
- Requires the user to have access to their email at login time. If email delivery is slow or filtered, login is blocked.
- Dependency on MailHog in local dev — requires Docker running. Documented in README as a prerequisite.
- Not suitable for scenarios where the email provider is down (single point of failure). Acceptable for a SaaS targeting technical users who manage their own infrastructure.

**Risks mitigated:**
- Password database breaches are entirely eliminated — there are no passwords to steal.
- Weak password choices (common passwords, reuse) are not possible.
