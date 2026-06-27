@~/.claude/prompts/new_functionality_prompt_spec.md

# Document Architectural Trade-offs in README

## Role
Act as a Software Architect with experience documenting technical decisions.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `dc_decisiones_documentadas`  
The README has a "Design Patterns" section listing patterns but not a "Decisions" section with real trade-offs. The evaluator requires at least 2 trade-offs explicitly documented (what was chosen, what was rejected, and why).

## Task
Add a `## Technical Decisions` section to `README.md` documenting **at least 3 real trade-offs** made during this project. Each decision must include:
- **Decision**: What was chosen.
- **Alternatives considered**: What was rejected.
- **Reason**: Why — including real technical constraints, not generic answers.
- **Consequence**: What was gained and what was sacrificed.

### Decisions to document (real decisions from this project)
1. **MongoDB native driver vs Mongoose** — chose native driver (`lib/db.ts` singleton). Trade-off: less abstraction but full control over queries + connection pool, no ODM overhead for a multitenant schema where `tenantId` must always be injected.
2. **JWT in localStorage vs HttpOnly cookie** — chose localStorage. Trade-off: easier to access in client components (Next.js App Router) but exposed to XSS. Mitigated by: no sensitive data in JWT beyond tenantId/email, short-lived magic link tokens.
3. **Magic link vs password auth** — chose magic link. Trade-off: requires email delivery (MailHog dependency) but eliminates password storage, hashing, and reset flows entirely.
4. **No middleware.ts — proxy instead** — per AGENTS.md rule #9. Trade-off: avoids edge runtime limitations at cost of extra proxy complexity.

### Guidelines
- Be specific. "We chose X because it's simpler" is not acceptable without elaborating what simplicity buys here.
- Reference actual code files to anchor claims (e.g., `lib/db.ts`, `lib/auth.ts`).
- 3–5 sentences per decision.

## Output format
Updated `README.md` with `## Technical Decisions` section containing a table or bullet list per decision.

## Output checklist and Guardrails
- [ ] At least 3 trade-offs documented
- [ ] Each has: chosen option + rejected alternative + reason + consequence
- [ ] References actual code files
- [ ] No generic statements ("we chose React because it's popular")
- [ ] Commit: `git commit -m "docs: add technical decisions section to README"`
