@~/.claude/prompts/new_functionality_prompt_spec.md

# Add Dockerfile and Deploy Instructions

## Role
Act as a DevOps Engineer and Software Architect expert in Docker, Next.js production builds, and Traefik.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `dc_instrucciones_deploy`  
No Dockerfile exists. The project must be containerized for deployment to the GCI VM at `34.174.56.186`.  
Infrastructure already running on the VM:
- Traefik v3.3 on ports 80/443 with wildcard `*.deviaaps.com` cert (Cloudflare DNS-01)
- Network: `miseia-net` (bridge)
- MongoDB at `mongodb://admin:MongoAdmin2024!@34.174.56.186:27020/?authSource=admin`
- MailHog accessible on the same network

Target domain: `mailing.deviaaps.com`  
Deploy directory on VM: `~/MISEIA120_mailing`

## Task

### 1. Create `Dockerfile` (multi-stage, production-optimized)
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Enable standalone output in `next.config.ts`:
```ts
const nextConfig = { output: 'standalone' }
```

### 2. Create `docker-compose.prod.yml`
```yaml
services:
  mailing:
    image: mailing-saas:latest
    container_name: mailing
    restart: unless-stopped
    environment:
      - MONGODB_URI=mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin
      - MONGODB_DB=mailing_saas
      - MAILHOG_HOST=mailhog
      - MAIL_PORT=1025
      - MAIL_FROM=noreply@mailing.local
      - JWT_SECRET=${JWT_SECRET}
      - NEXT_PUBLIC_API_URL=https://mailing.deviaaps.com
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mailing.rule=Host(`mailing.deviaaps.com`)"
      - "traefik.http.routers.mailing.entrypoints=websecure"
      - "traefik.http.routers.mailing.tls=true"
      - "traefik.http.routers.mailing.tls.certresolver=cloudflare"
      - "traefik.http.services.mailing.loadbalancer.server.port=3000"
    networks:
      - miseia-net

networks:
  miseia-net:
    external: true
```

### 3. Add `## Deployment` section to README
Document the exact steps to deploy:
```bash
# 1. Build image
docker build -t mailing-saas:latest .

# 2. SSH to VM
ssh -i C:\ubuntuiso\.ssh\vboxuser gcvmuser@34.174.56.186

# 3. On VM: clone/pull repo, set env, start
cd ~/MISEIA120_mailing
docker compose -f docker-compose.prod.yml up -d
```

## Output format
- `Dockerfile` at project root
- `docker-compose.prod.yml` at project root
- Updated `next.config.ts` with `output: 'standalone'`
- README `## Deployment` section with step-by-step instructions
- `.dockerignore` excluding `node_modules`, `.next`, `.env.local`

## Output checklist and Guardrails
- [ ] `docker build -t mailing-saas:latest .` succeeds locally
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] `docker-compose.prod.yml` uses `miseia-net` external network
- [ ] Traefik labels set for `mailing.deviaaps.com`
- [ ] No hardcoded secrets in `docker-compose.prod.yml` (use `${JWT_SECRET}`)
- [ ] `.dockerignore` present
- [ ] README `## Deployment` section documents full deploy steps
- [ ] Commit: `git commit -m "chore: add Dockerfile and production docker-compose"`
