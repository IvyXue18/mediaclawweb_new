# Settings Credentials Management Specification

## Overview

- **Old source page:** `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/credentials/page.tsx`
- **Old source action:** `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/credentials/credential-actions.tsx`
- **Old source API:** `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/api/user/credentials/[id]/route.ts`
- **Target page:** `src/routes/settings/credentials.tsx`
- **Target API:** `src/routes/api/user/credentials/$id.ts`
- **Target service:** `src/modules/credentials/service.ts`
- **Interaction model:** server-paginated table with click-driven owner freeze action.

## Old-Site Contract

The old settings credentials page shows the current user's managed credentials with these operational columns:

- `code`
- `status`
- `expiresAt`
- `remainingCredits`
- `currentBindings / maxBindings`
- `sourceOrderNo`
- `lastRechargedAt`
- last 90-day billing summary: grant credits and consume credits
- last 90-day monitoring summary: monitoring consume credits and record count
- actions: view billing, view monitoring, freeze/stop credential

The freeze action calls `POST /api/user/credentials/:id` with `{ action: "freeze" }`. The API requires an authenticated owner, rejects unsupported actions, and freezes only credentials owned by the current user.

## New-Site Target Behavior

- `listCredentials` should enrich rows with the old table summary fields:
  - `currentBindings`
  - `remainingCredits`
  - `lastRechargedAt`
  - `last90GrantCredits`
  - `last90ConsumeCredits`
  - `last90MonitorConsumeCredits`
  - `last90MonitorConsumeCount`
- `/api/user/credentials/$id` should support the old owner freeze POST while retaining the existing owner-scoped GET.
- `/settings/credentials` should render the old summary columns and actions using locale messages already present in `messages/{en,zh}.json`.
- Freeze should invalidate the user credentials query and show success/error toast feedback.

## Test Hooks

- `data-credential-row-actions`
- `data-credential-freeze`

## Remaining Boundaries

- This slice restores website-side management parity. It does not prove plugin-side behavior after freeze; that still needs plugin/API runtime validation against credential verification and internal consume routes.
