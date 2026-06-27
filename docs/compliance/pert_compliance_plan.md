# PERT Compliance Plan — Mailing SaaS
**Fecha:** 2026-06-27  
**Proyecto:** `1-4-120-mailing/mailing`

---

## PERT Compliance Plan

Árbol de dependencias para resolver los 12 issues no conformes. Las tareas sin dependencia pueden ejecutarse en paralelo.

```
[START]
  ├─► T01: .env.example               (sin deps)  → 006_env_example_dc_prompt.md
  ├─► T02: Diagrama arquitectura      (sin deps)  → 007_diagrama_arquitectura_dc_prompt.md
  ├─► T03: Decisiones documentadas    (sin deps)  → 008_decisiones_documentadas_dc_prompt.md
  ├─► T04: Cambios IA documentados    (sin deps)  → 009_cambios_ia_dc_prompt.md
  ├─► T05: ADRs                       (sin deps)  → 010_adrs_dc_prompt.md
  ├─► T06: Justificación cuantitativa (sin deps)  → 011_justificacion_cuantitativa_dc_prompt.md
  ├─► T07: Tests mínimos              (sin deps)  → 002_tests_minimos_cq_prompt.md
  │     └─► T08: Cobertura alta       (dep: T07)  → 003_cobertura_alta_cq_prompt.md
  └─► T09: Dockerfile + deploy instr  (sin deps)  → 012_instrucciones_deploy_dc_prompt.md
        ├─► T10: GitHub CI/CD         (dep: T07, T09) → 004_ci_github_cq_prompt.md  ← CRÍTICO
        ├─► T11: GitLab CI/CD         (dep: T07, T09) → 005_ci_gitlab_cq_prompt.md
        └─► T12: Deploy público       (dep: T10, T09) → 001_deploy_publico_fn_prompt.md
```

**Ruta crítica:** T07 → T08 → T09 → T10 → T12

---

## Execution PERT

| # | Tarea | Criterio | Dependencias | Archivo de Prompt | Severidad | Tiempo Est. |
|---|---|---|---|---|---|---|
| 1 | Crear `.env.example` | `dc_env_example` + `cq_sin_secretos_en_repo` | — | `006_env_example_dc_prompt.md` | Media | 15 min |
| 2 | Diagrama de arquitectura (mermaid) | `dc_diagrama_arquitectura` | — | `007_diagrama_arquitectura_dc_prompt.md` | Media | 30 min |
| 3 | Documentar decisiones con trade-offs | `dc_decisiones_documentadas` | — | `008_decisiones_documentadas_dc_prompt.md` | Media | 45 min |
| 4 | Documentar uso y revisión de IA | `dc_cambios_ia_documentados` | — | `009_cambios_ia_dc_prompt.md` | Baja | 20 min |
| 5 | ADRs (Architecture Decision Records) | `dc_adrs_o_decision_log` | — | `010_adrs_dc_prompt.md` | Baja | 60 min |
| 6 | Justificación cuantitativa | `dc_justificacion_cuantitativa` | — | `011_justificacion_cuantitativa_dc_prompt.md` | Baja | 30 min |
| 7 | Tests automatizados (unit + e2e Playwright) | `cq_tests_minimos` | — | `002_tests_minimos_cq_prompt.md` | Alta | 3 h |
| 8 | Reporte de cobertura > 60% | `cq_cobertura_alta` | T7 | `003_cobertura_alta_cq_prompt.md` | Media | 1 h |
| 9 | Dockerfile + instrucciones deploy | `dc_instrucciones_deploy` | — | `012_instrucciones_deploy_dc_prompt.md` | Alta | 1 h |
| 10 | GitHub Actions CI/CD pipeline | `cq_ci_funcional` | T7, T9 | `004_ci_github_cq_prompt.md` | Alta | 1.5 h |
| 11 | GitLab CI pipeline | `cq_ci_funcional` | T7, T9 | `005_ci_gitlab_cq_prompt.md` | Alta | 1 h |
| 12 | Deploy público en GCI VM + URL en README | `fn_deploy_publico_accesible` | T9, T10 | `001_deploy_publico_fn_prompt.md` | Alta | 2 h |

**Tiempo total estimado (ruta crítica):** ~9.5 horas  
**Con paralelismo (doc + test + infra):** ~4.5 horas  
