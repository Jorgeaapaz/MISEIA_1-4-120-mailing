@~/.claude/prompts/new_functionality_prompt_spec.md

# Create a Github CI/CD Pipeline and Deploy App to VM at Google Cloud

## Role
Act as a Software Architect, you are an expert in Github and Google Cloud Services

## Task
Create Github actions that allows to compile and deploy the app to `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186` in the directory ~/MISEIA120_mailing. Test and build must be done in a GitHub Actions. The service must be created in the remote ubuntu VM in Docker.

The app must be accessible through Traefik using the domain `mailing.deviaaps.com`, port 30001, use the traefik wildcard *.deviaaps.com.

Use /gh and gcloud for all secrets required.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `cq_ci_funcional` (GitHub)  
Prerequisite: `002_tests_minimos_cq_prompt.md` (Vitest + Playwright) and `012_instrucciones_deploy_dc_prompt.md` (Dockerfile) must be completed first.

- VM IP: `34.174.56.186`
- SSH user: `gcvmuser`
- SSH key: `C:\ubuntuiso\.ssh\vboxuser`
- Deploy dir on VM: `~/MISEIA120_mailing`
- Traefik network: `miseia-net`
- MongoDB: `mongodb://admin:MongoAdmin2024!@mongodb:27020/?authSource=admin` (internal Docker network uses `mongodb:27017`)
- Domain: `mailing.deviaaps.com`

## Pipeline Requirements

### Workflow file: `.github/workflows/ci-cd.yml`

Trigger on push to `master` branch.

**Jobs:**
1. **test** — runs on `ubuntu-latest`:
   - Checkout code
   - Setup Node.js 20
   - `npm ci`
   - `npm run lint`
   - `npm run test` (Vitest unit tests)
   - (Optional) Playwright E2E against test DB if available

2. **build-and-deploy** — depends on `test`, runs on `ubuntu-latest`:
   - Build Docker image: `docker build -t mailing-saas:latest .`
   - Save image as tarball: `docker save mailing-saas:latest | gzip > mailing-saas.tar.gz`
   - SCP tarball to VM using SSH key secret
   - SSH to VM: load image, stop old container, start new with `docker compose -f docker-compose.prod.yml up -d --force-recreate`

### GitHub Secrets to configure (use `/gh` CLI)
```bash
gh secret set VM_SSH_KEY < C:\ubuntuiso\.ssh\vboxuser
gh secret set VM_HOST --body "34.174.56.186"
gh secret set VM_USER --body "gcvmuser"
gh secret set JWT_SECRET --body "<production-jwt-secret>"
gh secret set MONGODB_URI --body "mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin"
```

### Guidelines
- Never hardcode secrets in workflow YAML
- Use `appleboy/ssh-action` or raw `ssh` for remote commands
- Add status badge to README: `![CI](https://github.com/<user>/mailing/actions/workflows/ci-cd.yml/badge.svg)`
- The `test` job must fail the pipeline if lint or tests fail

## Output format
- `.github/workflows/ci-cd.yml`
- Updated README with CI badge and description of pipeline stages

## Output checklist and Guardrails
- [ ] `.github/workflows/ci-cd.yml` created
- [ ] `test` job runs lint + unit tests
- [ ] `build-and-deploy` depends on `test`
- [ ] All secrets via `${{ secrets.X }}`, never hardcoded
- [ ] Deployment uses `docker-compose.prod.yml` with Traefik labels for `mailing.deviaaps.com`
- [ ] README has CI badge
- [ ] Push to `master` triggers the workflow
- [ ] Commit: `git commit -m "ci: add GitHub Actions CI/CD pipeline"`
