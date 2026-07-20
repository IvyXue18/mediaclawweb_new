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
  node scripts/create-staging-wrangler-config.mjs
  wrangler deploy --config .wrangler/staging-wrangler.json
  exit 0
fi

if [ "$deploy_env" != "production" ]; then
  echo "Unsupported CF_DEPLOY_ENV: $deploy_env" >&2
  exit 1
fi

set -a
if [ -f .env.production ]; then
  . ./.env.production
fi
set +a

pnpm cf:build
wrangler deploy
pnpm indexnow:submit
