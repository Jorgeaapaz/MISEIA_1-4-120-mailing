@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Automated Tests — Unit + E2E (Playwright)

## Role
Act as a Software Developer and QA Engineer expert in Next.js testing with Vitest and Playwright.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `cq_tests_minimos`  
No automated tests exist. The project uses Next.js 16, TypeScript, MongoDB, Handlebars, and JWT. Tests must cover the critical flows defined in AGENTS.md:
1. Login by magic link end-to-end
2. Create client → list → edit → soft delete
3. Create template with Handlebars variables → preview → test send
4. Create campaign → select template + segment → send → verify logs

## Task
1. Install and configure **Vitest** for unit tests + **Playwright** for E2E tests.
2. Write unit tests for pure logic in `lib/`:
   - `lib/handlebars.ts`: `renderTemplate(template, context)` and `extractVariables(htmlBody)`
   - `lib/auth.ts`: `signJwt(payload)` + `verifyJwt(token)` + `extractTenant(token)`
3. Write Playwright E2E tests for the 4 critical flows listed above.
4. Add `npm run test` (Vitest) and `npm run test:e2e` (Playwright) to `package.json`.
5. Document test execution in README.

### Setup Guidelines
```bash
# Vitest for unit tests
npm install -D vitest @vitejs/plugin-react

# Playwright for E2E
npm install -D @playwright/test
npx playwright install chromium
```

Configure `vitest.config.ts` at project root. Create `tests/unit/` for Vitest and `tests/e2e/` for Playwright.

### Unit Test Guidelines
- Test `renderTemplate('Hello {{name}}', { name: 'Ana' })` → `'Hello Ana'`
- Test `extractVariables('<p>{{foo}} {{bar}}</p>')` → `['foo', 'bar']`
- Test `verifyJwt(signJwt({ tenantId: 't1' }))` → `{ tenantId: 't1' }`
- Test expired token returns null/throws
- No mocking MongoDB — unit tests only cover pure functions

### E2E Test Guidelines
- E2E tests run against `npm run dev` on port 3000
- Use `playwright.config.ts` with `baseURL: 'http://localhost:3000'`
- For magic link flow: POST to `/api/auth/magic-link`, then GET MailHog API at `http://localhost:8025/api/v2/messages` to extract the link
- Use `page.evaluate()` to inject JWT into localStorage for authenticated flows

## Output format
- `tests/unit/*.test.ts` — Vitest unit tests
- `tests/e2e/*.spec.ts` — Playwright E2E tests
- `vitest.config.ts` — Vitest config
- `playwright.config.ts` — Playwright config
- Updated `package.json` scripts
- Updated README with test commands

## Output checklist and Guardrails
- [ ] `npm run test` runs Vitest without errors
- [ ] `npm run test:e2e` runs Playwright without errors
- [ ] At least 8 unit tests covering lib/ functions
- [ ] At least 4 Playwright specs covering the critical flows
- [ ] README documents: `npm run test`, `npm run test:e2e`, prerequisites (MailHog running)
- [ ] No `any` types in test files
- [ ] Commit after tests pass: `git commit -m "test: add Vitest unit tests and Playwright e2e tests"`
