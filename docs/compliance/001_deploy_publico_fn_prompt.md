@~/.claude/prompts/new_functionality_prompt_spec.md

# Deploy Mailing SaaS to GCI VM — Public URL at mailing.deviaaps.com

## Role
Act as a DevOps Engineer and Software Architect expert in Docker, Traefik, and Google Cloud infrastructure.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `fn_deploy_publico_accesible` + `dc_instrucciones_deploy`  
Prerequisite: `012_instrucciones_deploy_dc_prompt.md` (Dockerfile) and `004_ci_github_cq_prompt.md` (GitHub CI) must be completed first.

Infrastructure on GCI VM `34.174.56.186`:
- SSH: `ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186`
- Traefik v3.3 running with `miseia-net` network and `*.deviaaps.com` wildcard cert
- MongoDB: `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- MailHog: accessible on `miseia-net` as `mailhog:1025`
- Docker and Docker Compose installed

Target: `https://mailing.deviaaps.com` publicly accessible.

## Task

### 1. Initial Deploy to VM (manual first deploy)
```bash
# On local machine — build and export image
docker build -t mailing-saas:latest .
docker save mailing-saas:latest | gzip > mailing-saas.tar.gz

# Copy to VM
scp -i C:\ubuntuiso\.ssh\vboxuser mailing-saas.tar.gz gcvmuser@34.174.56.186:~/MISEIA120_mailing/

# SSH to VM and deploy
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186
mkdir -p ~/MISEIA120_mailing
cd ~/MISEIA120_mailing
docker load < mailing-saas.tar.gz
# Copy docker-compose.prod.yml and .env.prod to VM
docker compose -f docker-compose.prod.yml up -d
```

### 2. Production `.env.prod` on VM
Create `~/MISEIA120_mailing/.env.prod` on the VM with:
```
MONGODB_URI=mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin
MONGODB_DB=mailing_saas
MAILHOG_HOST=mailhog
MAIL_PORT=1025
MAIL_FROM=noreply@mailing.local
JWT_SECRET=<strong-random-secret-min-32-chars>
NEXT_PUBLIC_API_URL=https://mailing.deviaaps.com
NODE_ENV=production
```
This file stays on the VM only — never committed to git.

### 3. Verify Deployment
```bash
# Check container is running
docker ps | grep mailing

# Check Traefik picked up the route
curl -I https://mailing.deviaaps.com

# Check app responds
curl https://mailing.deviaaps.com/api/health  # or check / redirects to /login
```

### 4. Update README
Add `## Live Demo` section at the top of README:
```markdown
## Live Demo
🌐 **https://mailing.deviaaps.com**

Test credentials (magic link):
- Email any address → check MailHog at https://mailhog.deviaaps.com
- Use the link from the email to authenticate
```

### Guidelines
- Ensure `docker-compose.prod.yml` has `network: miseia-net` marked as `external: true`
- Traefik labels must use `certresolver: cloudflare` for HTTPS
- App must respond at `https://mailing.deviaaps.com` (not just HTTP)
- MailHog on VM is accessible internally as `mailhog:1025` on `miseia-net`
- If MongoDB internal resolution fails, use `34.174.56.186:27020` as fallback

## Output format
- Deployed and accessible at `https://mailing.deviaaps.com`
- README `## Live Demo` section with public URL
- Deployment verification checklist completed

## Output checklist and Guardrails
- [ ] `https://mailing.deviaaps.com` returns HTTP 200 (or 302 to /login)
- [ ] HTTPS certificate valid (Cloudflare DNS-01 wildcard)
- [ ] Magic link flow works end-to-end in production (sends email via MailHog)
- [ ] MongoDB data persists across container restarts
- [ ] README has public URL documented in `## Live Demo`
- [ ] No secrets in git repository
- [ ] Commit: `git commit -m "docs: add live demo URL to README"`
