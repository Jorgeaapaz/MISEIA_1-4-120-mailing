@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Quantitative Justification for Technical Decisions

## Role
Act as a Software Engineer experienced in performance analysis and technical documentation.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `dc_justificacion_cuantitativa`  
No technical decision is currently backed by numbers (benchmark, latency, cost, comparison). The evaluator requires at least one decision justified with measurable data.

## Task
Add quantitative evidence to at least one technical decision in `README.md` or `docs/decisions/`. Suitable candidates:

1. **MongoDB connection singleton (`lib/db.ts`)**: Measure connection pool reuse vs. creating a new MongoClient per request. Document the connection time difference (typically 50–200ms per new connection vs. <1ms for pool reuse).
2. **Handlebars template compile cache**: Measure `Handlebars.compile()` time on first call vs. cached template execution. Document that compilation is ~5–15ms while execution is <1ms — justifying the compile-once pattern.
3. **Campaign fan-out send timing**: Document throughput — how many emails can be sent per second through MailHog's SMTP, justifying the sequential (not parallel) send approach for reliability over speed.

### How to obtain measurements
- Use `console.time()` / `console.timeEnd()` in dev mode.
- Or use `performance.now()` around the measured operation in a test script.
- Run 100 iterations and report mean + p95.
- Document the measurement script in `scripts/benchmark.ts` or inline in the ADR.

### Guidelines
- Numbers must be real (actually measured), not estimated.
- State the measurement environment (Node.js version, machine specs, MongoDB local vs remote).
- Include the measurement command so it is reproducible.
- Add results to the relevant ADR or a new `## Performance Notes` section in README.

## Output format
Updated ADR or README section with real numbers, measurement methodology, and conclusion.

## Output checklist and Guardrails
- [ ] At least one decision backed by measured numbers
- [ ] Measurement environment documented
- [ ] Numbers are reproducible (script or command provided)
- [ ] Conclusion drawn from numbers (not just "it was faster")
- [ ] Commit: `git commit -m "docs: add quantitative benchmark justification"`
