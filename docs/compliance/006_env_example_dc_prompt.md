@~/.claude/prompts/new_functionality_prompt_spec.md

# Create .env.example for Mailing SaaS

## Role
Act as a Software Developer and DevOps Engineer expert in Next.js and security best practices.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `dc_env_example` + `cq_sin_secretos_en_repo`  
The project uses `.env.local` (gitignored) but there is no `.env.example` template for onboarding.  
Required variables are documented in AGENTS.md and used throughout `lib/` and `app/api/`.

## Task
1. Create `.env.example` at project root with all required environment variables, **no real values**, descriptive placeholders only.
2. Update `README.md` to reference `.env.example` in the installation section — add a step: `cp .env.example .env.local` and fill in values.
3. Verify no real secrets exist in any committed file: run `git log -p | grep -iE 'api_key|secret|password|jwt_secret'` and confirm only `.env.example` appears with placeholder values.

### .env.example Guidelines
- Use descriptive placeholders: `your-jwt-secret-min-32-chars`, `your-mongo-uri`, etc.
- Include ALL variables referenced in the codebase (grep `process.env.` across `lib/` and `app/api/`).
- Add inline comments explaining each variable's purpose.
- Do NOT include real values from `.env.local`.

## Output format
A `.env.example` file at project root, and updated `README.md` installation section.

## Examples and Steps to follow
1. `grep -r "process.env\." lib/ app/api/` to collect all env var names used.
2. Write `.env.example` with placeholder values and comments.
3. Update README `## Quick Start` or `## Installation` section to include the `cp` step.
4. Commit: `git add .env.example README.md && git commit -m "chore: add .env.example template"`.

## Output checklist and Guardrails
- [ ] `.env.example` exists at project root
- [ ] All env vars referenced in code appear in `.env.example`
- [ ] No real secrets in `.env.example`
- [ ] README references `.env.example` in installation steps
- [ ] `.env.example` is tracked by git (not in `.gitignore`)
