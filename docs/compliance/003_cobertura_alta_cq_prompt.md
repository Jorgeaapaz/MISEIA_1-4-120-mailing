@~/.claude/prompts/new_functionality_prompt_spec.md

# Achieve >60% Test Coverage with Coverage Report

## Role
Act as a QA Engineer and Software Developer expert in test coverage tools.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `cq_cobertura_alta`  
Prerequisite: `002_tests_minimos_cq_prompt.md` must be completed first (Vitest + Playwright tests exist).  
The evaluator requires >60% line coverage on domain code and >40% global, with a coverage report.

## Task
1. Configure Vitest with `@vitest/coverage-v8` to generate a coverage report.
2. Run coverage and analyze the report to identify under-covered areas.
3. Add additional unit tests to reach >60% on `lib/` files.
4. Generate an HTML + JSON coverage report.
5. Add a coverage badge or summary to README.
6. Add `npm run test:coverage` script to `package.json`.

### Setup
```bash
npm install -D @vitest/coverage-v8
```

Update `vitest.config.ts`:
```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/types.ts'],
      thresholds: { lines: 60, functions: 60 }
    }
  }
})
```

Add to `package.json`:
```json
"test:coverage": "vitest run --coverage"
```

### Coverage Targets
| File | Target |
|---|---|
| `lib/handlebars.ts` | >80% |
| `lib/auth.ts` | >80% |
| `lib/mailer.ts` | >40% (mock transport) |
| `lib/db.ts` | >40% (mock MongoClient) |
| Global | >60% |

### Guidelines
- Add `coverage/` to `.gitignore`
- Commit the coverage configuration but not the generated report
- Add `npm run test:coverage` output summary to README as a text table (not a badge that requires CI)

## Output format
- Updated `vitest.config.ts` with coverage config
- New unit tests to reach thresholds
- `coverage/` in `.gitignore`
- README updated with coverage summary table
- Updated `package.json` scripts

## Output checklist and Guardrails
- [ ] `npm run test:coverage` runs without errors
- [ ] Coverage report shows >60% lines on `lib/`
- [ ] Coverage thresholds enforced (build fails if below)
- [ ] `coverage/` directory in `.gitignore`
- [ ] README has coverage summary
- [ ] Commit: `git commit -m "test: add coverage configuration and reach 60% threshold"`
