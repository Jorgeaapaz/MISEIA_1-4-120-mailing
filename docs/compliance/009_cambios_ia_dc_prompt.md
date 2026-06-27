@~/.claude/prompts/new_functionality_prompt_spec.md

# Document AI Usage and Critical Review

## Role
Act as a Software Developer documenting AI-assisted development practices.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `dc_cambios_ia_documentados`  
The evaluator requires explicit documentation of which parts were AI-generated, what the student changed versus the AI draft, and evidence of critical review (not blind acceptance).

## Task
Add a `## AI-Assisted Development` section to `README.md` (or create `docs/ai-usage.md`) that documents:
1. Which parts of the project were scaffolded or drafted with AI assistance.
2. What specific changes were made to the AI-generated drafts and why.
3. At least 2 concrete examples of critical review: cases where the AI suggestion was rejected or modified.
4. What was written from scratch without AI.

### Guidelines
- Be honest and specific. "The AI generated boilerplate and I adapted it" is insufficient.
- Reference specific files or functions that were substantially modified.
- Include at least one example where AI output was wrong or insufficient and how it was corrected.
- This is not about hiding AI use — it is about demonstrating critical judgment.

## Output format
`## AI-Assisted Development` section in README or a separate `docs/ai-usage.md` file, referenced from README.

## Examples and Steps to follow
Example entry:
> **`lib/handlebars.ts`** — AI draft used `Handlebars.compile()` on every call. Changed to compile-once-cache-on-module-load pattern to avoid re-compilation overhead per request. The AI did not account for Next.js hot-reload invalidating module cache in dev mode; added conditional re-compilation for `NODE_ENV=development`.

## Output checklist and Guardrails
- [ ] Section exists in README or linked doc
- [ ] At least 2 concrete examples of modifications to AI drafts
- [ ] At least 1 example of rejected AI suggestion with explanation
- [ ] Mentions what was written independently
- [ ] Commit: `git commit -m "docs: add AI-assisted development section"`
