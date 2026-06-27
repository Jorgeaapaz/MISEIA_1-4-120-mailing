@~/.claude/prompts/new_functionality_prompt_spec.md

# Create Architecture Decision Records (ADRs)

## Role
Act as a Software Architect experienced in documenting architectural decisions with the ADR format.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `dc_adrs_o_decision_log`  
No ADRs exist. The evaluator requires structured decision logs with context/decision/consequences per key architectural decision.

## Task
Create a `docs/decisions/` directory with at least 3 ADR files following the standard format. Each ADR documents one key architectural decision made in this project.

### ADRs to create
1. `ADR-001-mongodb-native-driver.md` — MongoDB native driver vs Mongoose/Prisma
2. `ADR-002-jwt-localstorage-auth.md` — JWT in localStorage vs HttpOnly session cookie
3. `ADR-003-magic-link-passwordless.md` — Passwordless magic link vs password-based auth
4. `ADR-004-handlebars-templating.md` — Handlebars vs other template engines (Mustache, EJS, Nunjucks)

### ADR Format (use exactly this structure)
```markdown
# ADR-NNN: [Title]

**Date:** YYYY-MM-DD  
**Status:** Accepted  

## Context
[What is the situation that requires a decision? What constraints exist?]

## Decision
[What was decided, stated clearly.]

## Consequences
**Positive:**
- ...

**Negative / Trade-offs:**
- ...

**Risks mitigated:**
- ...
```

### Guidelines
- Each ADR should be 200–400 words.
- Reference actual code files (e.g., `lib/db.ts`) to ground the decision.
- Be specific about what alternatives were considered.
- Update README to reference `docs/decisions/` directory.

## Output format
Directory `docs/decisions/` with 4 ADR markdown files + README update with link.

## Output checklist and Guardrails
- [ ] `docs/decisions/` directory created
- [ ] At least 3 ADR files with correct structure
- [ ] Each ADR has: Context, Decision, Consequences (positive + negative)
- [ ] README has `## Architecture Decision Records` link to `docs/decisions/`
- [ ] Commit: `git commit -m "docs: add architecture decision records"`
