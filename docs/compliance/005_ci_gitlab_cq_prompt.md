@~/.claude/prompts/new_functionality_prompt_spec.md

# Create GitLab CI/CD Pipeline and Deploy to GCI VM

## Role
Act as a DevOps Engineer expert in GitLab CI/CD and Google Cloud infrastructure.

## Context
Project: `D:\Master-IA-Dev\04-Bloque4\1-4-120-mailing\mailing`  
Issue: `cq_ci_funcional` (GitLab)  
Use `/glab` skill for GitLab CLI operations.  
Prerequisite: `002_tests_minimos_cq_prompt.md` (tests) and `012_instrucciones_deploy_dc_prompt.md` (Dockerfile) must be completed first.

Infrastructure:
- VM IP: `34.174.56.186`, user: `gcvmuser`, key: `C:\ubuntuiso\.ssh\vboxuser`
- Deploy dir: `~/MISEIA120_mailing`
- Domain: `mailing.deviaaps.com` via Traefik `miseia-net`
- MongoDB internal: `mongodb://admin:MongoAdmin2024!@mongodb:27017/?authSource=admin`

## Task
Create `.gitlab-ci.yml` at project root with the following pipeline:

### Stages: `test` → `build` → `deploy`

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_IMAGE: mailing-saas

lint-and-test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run lint
    - npm run test
  cache:
    paths:
      - node_modules/

build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t $DOCKER_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker save $DOCKER_IMAGE:$CI_COMMIT_SHORT_SHA | gzip > mailing-saas.tar.gz
  artifacts:
    paths:
      - mailing-saas.tar.gz
    expire_in: 1 hour
  only:
    - master

deploy-to-vm:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$VM_SSH_KEY" | ssh-add -
    - mkdir -p ~/.ssh && chmod 700 ~/.ssh
    - ssh-keyscan -H $VM_HOST >> ~/.ssh/known_hosts
  script:
    - scp mailing-saas.tar.gz $VM_USER@$VM_HOST:~/MISEIA120_mailing/
    - |
      ssh $VM_USER@$VM_HOST << 'EOF'
        cd ~/MISEIA120_mailing
        docker load < mailing-saas.tar.gz
        docker compose -f docker-compose.prod.yml up -d --force-recreate
      EOF
  only:
    - master
  needs:
    - build-image
```

**Important:** Do NOT set `NODE_ENV=production` as a job-level variable. Only set it in the `docker-compose.prod.yml` environment for the container, or pass it only to the `npm run build` command if needed:
```yaml
script:
  - NODE_ENV=production npm run build
```

### GitLab CI/CD Variables (set via glab CLI or GitLab UI)
```bash
glab variable set VM_SSH_KEY --value "$(cat C:\ubuntuiso\.ssh\vboxuser)" --masked
glab variable set VM_HOST --value "34.174.56.186"
glab variable set VM_USER --value "gcvmuser"
glab variable set JWT_SECRET --value "<production-jwt-secret>" --masked
```

### Guidelines
- `NODE_ENV=production` only on the npm build command, not as a job-level variable
- Use `needs:` instead of `dependencies:` for artifact passing
- Pipeline must show green on GitLab before marking this issue resolved
- Add GitLab pipeline badge to README

## Output format
- `.gitlab-ci.yml` at project root
- Updated README with GitLab pipeline badge

## Output checklist and Guardrails
- [ ] `.gitlab-ci.yml` has 3 stages: test, build, deploy
- [ ] `NODE_ENV=production` is NOT a job-level variable
- [ ] Lint + unit tests run in `test` stage
- [ ] Docker image built and saved as artifact in `build` stage
- [ ] Deployed to VM via SSH in `deploy` stage, only on `master`
- [ ] All secrets via CI/CD variables, not hardcoded
- [ ] README has GitLab badge
- [ ] Commit: `git commit -m "ci: add GitLab CI/CD pipeline"`
