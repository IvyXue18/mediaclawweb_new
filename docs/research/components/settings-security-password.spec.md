# Settings Security Password Specification

## Old Source References

- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/security/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/zh/settings/security.json`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/en/settings/security.json`

## Migrated Targets

- `src/routes/settings/security.tsx`
- `src/routes/api/user/security/password.ts`
- `messages/zh.json`
- `messages/en.json`

## Behavior Restored

- `/settings/security` is no longer a placeholder link page.
- The page shows the old account security password form:
  - disabled email field from the signed-in user
  - current password
  - new password
  - confirm new password
  - save button
- Client validation matches the old behavior:
  - current password is required
  - new password must be at least 6 characters
  - confirmation must match
- Server behavior matches the old server action:
  - require authenticated user
  - find the user's `credential` account row
  - compare the current password with `verifyPassword`
  - store the new password using `hashPassword`
  - return stable error messages for missing account, incorrect current password, and invalid input

## Interaction Model

- Static form with submit-driven mutation.
- Inline validation appears before the API call.
- API errors appear both as toast feedback and an inline alert.
- Success leaves the user on `/settings/security` with inline confirmation.

## Test Hooks

- `data-settings-security-page`
- `data-security-password-form`
- `data-security-password-error`
- `data-security-password-success`
- `data-security-password-submit`

## Remaining Gap

This slice restores password-change behavior for credential accounts. It does not implement account deletion, session/device management, or OAuth-provider security controls.
