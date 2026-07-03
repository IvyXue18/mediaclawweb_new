# Settings Credentials Runtime Specification

## Overview

- **Old validate source:** `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/api/user/validate-credential/route.ts`
- **Old consume source:** `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/api/internal/credential/consume/route.ts`
- **Target validate route:** `src/routes/api/user/validate-credential.ts`
- **Target consume route:** `src/routes/api/internal/credential/consume.ts`
- **Interaction model:** plugin/API runtime validation after website credential state changes.

## Old-Site Contract

The old plugin validation endpoint:

- Requires a signed-in user.
- Accepts `credential_code`.
- Returns claimable when the code has no owner.
- Returns owned when the code belongs to the signed-in user.
- Rejects a code owned by another user.

The old internal consume endpoint:

- Requires `x-internal-token`.
- Accepts `credential_code`, `credits`, `scene`, `description`, `metadata`, and `biz_no`.
- Consumes from `credential_credit` and records a `credit` transaction.
- Uses `credential_consume:<userId>:<biz_no>` for idempotent transactions.

## New-Site Closure Behavior

The website now supports owner-side freeze for credentials, so plugin-facing runtime APIs must observe the status transition:

- `/api/user/validate-credential` accepts `credential_code` in addition to existing aliases.
- Validation is owner-aware and no longer returns another user's credential object.
- Non-active credentials return an error such as `credential is frozen`.
- `/api/internal/credential/consume` checks the parent credential row before consuming credits.
- Internal consume rejects missing, deleted, non-active, or owner-mismatched parent credentials before updating `credential_credit` or inserting `credit`.

## Test Coverage

- `tests/p1/credential-runtime-routes.test.ts`

## Remaining Boundaries

- These tests verify route behavior with mocked data. A full browser-extension acceptance run still needs a real plugin request flow against a frozen credential.
