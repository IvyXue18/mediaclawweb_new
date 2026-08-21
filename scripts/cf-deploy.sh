#!/bin/sh
set -eu

deploy_env="${CF_DEPLOY_ENV:-production}"

if [ "$deploy_env" = "staging" ]; then
  export DATABASE_PROVIDER="postgresql"
  export VITE_APP_URL="https://staging.mediaclaw.app"
  export AUTH_URL="https://staging.mediaclaw.app"
  export VITE_APP_NAME="MediaClaw"
  export VITE_DEFAULT_LOCALE="zh"

  pnpm cf:build
  node scripts/create-wrangler-deploy-config.mjs staging
  wrangler deploy --config .wrangler/staging-wrangler.json
  exit 0
fi

if [ "$deploy_env" != "production" ]; then
  echo "Unsupported CF_DEPLOY_ENV: $deploy_env" >&2
  exit 1
fi

deploy_branch="$(git branch --show-current)"
if [ "$deploy_branch" != "main" ]; then
  echo "Production deploys are only allowed from main (current: ${deploy_branch:-detached HEAD})." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Production deploys require a clean main worktree." >&2
  exit 1
fi

git fetch origin main
deploy_head="$(git rev-parse HEAD)"
origin_main_head="$(git rev-parse origin/main)"
if [ "$deploy_head" != "$origin_main_head" ]; then
  echo "Production deploys require main to match origin/main." >&2
  exit 1
fi

set -a
if [ -f .env.production ]; then
  . ./.env.production
fi
set +a

pnpm cf:build
node scripts/create-wrangler-deploy-config.mjs production
wrangler deploy --config .wrangler/production-wrangler.json
# IndexNow submission is best-effort: a rejected/misconfigured key (e.g. 403)
# must not fail the deploy. Warn and continue instead of aborting.
pnpm indexnow:submit || echo "[cf-deploy] warning: indexnow:submit failed (non-fatal); continuing" >&2
