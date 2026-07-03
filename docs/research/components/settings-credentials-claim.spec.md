# Settings Credentials Claim Specification

## Old Source References

- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/credentials/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/credentials/credential-claim-dialog.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/credentials/credential-actions.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/zh/settings/credentials.json`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/en/settings/credentials.json`

## Migrated Targets

- `src/routes/settings/credentials.tsx`
- `src/routes/api/user/credentials/claim-status.ts`
- `src/routes/api/user/credentials/claim.ts`
- `src/routes/api/user/credentials.ts`
- `src/modules/credentials/service.ts`
- `messages/zh.json`
- `messages/en.json`

## Behavior Restored

- `/settings/credentials` claim dialog no longer directly submits a code without precheck.
- The dialog restores the old two-step flow:
  - enter activation code
  - check claim status
  - show claimable/not-claimable status panel
  - enable confirm claim only when the code is claimable
  - show success guidance telling the user to return to the plugin and verify/bind again
- `/api/user/credentials/claim-status` now supports the old `POST` payload with `credential_code` and returns code-specific status:
  - `claimable`
  - `not_found`
  - `invalid_status`
  - `already_owned`
  - `owned_by_other`
  - `already_claimed`
  - `invalid_code`
- `/api/user/credentials/claim` and `/api/user/credentials` now accept old payload aliases including `credential_code`.
- Claim failures now return stable reason data so the dialog can keep the user in context.

## Interaction Model

- Dialog is click-driven.
- `Check Status` submits status lookup and renders a colored status panel.
- `Confirm Claim` is disabled until status lookup reports `claimable: true`.
- Successful claim leaves the dialog open with success guidance and refreshes the credential list.

## Test Hooks

- `data-credential-claim-status`
- `data-credential-claim-success`
- `data-credential-claim-error`
- `data-credential-claim-check`
- `data-credential-claim-confirm`

## Remaining Gap

This slice restores the old claim precheck and payload contract. The full credentials table still needs later parity for remaining credits, current bindings, recent billing/monitoring summaries, and the old per-row freeze action.
