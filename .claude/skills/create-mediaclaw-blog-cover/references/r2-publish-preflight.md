# R2 publish preflight

Use this repository-local contract before publishing:

- API: `POST https://mediaclaw.app/api/storage/upload-image`
- body: `multipart/form-data`, image file in the `files` field
- auth: Better Auth session cookie in `MEDIACLAW_UPLOAD_COOKIE`
- success: JSON `code: 0`, with the first URL at `data.urls[0]`
- R2 proof: the URL must be absolute, return `200` or `206`, and have an
  `image/*` content type

Confirm the implementation still exists at
`src/routes/api/storage/upload-image.ts` before a live upload. If that route or
response contract has changed, update this skill and its script before
publishing.

For blog covers, this API is the only allowed upload path. Do not open the admin
uploader, ask the user to upload manually, use `wrangler r2 object put`, or
commit a `public/` fallback. If the API is unavailable, stop with a precise
blocked result instead of switching mechanisms.

## Authentication setup when missing or expired

If `MEDIACLAW_UPLOAD_COOKIE` already contains a valid session cookie, reuse it
and skip this setup. Otherwise:

1. Sign in at `https://mediaclaw.app/sign-in` in a browser. Do not navigate to
   the admin uploader.
2. In browser developer tools, copy the current request `Cookie` header that
   contains either `better-auth.session_token` or
   `__Secure-better-auth.session_token`.
3. Set it only in the local shell environment:

   ```bash
   export MEDIACLAW_UPLOAD_COOKIE='__Secure-better-auth.session_token=...'
   ```

Do not paste the cookie into a prompt, commit it, put it in a receipt, or pass
it through `--cookie` where another process may observe command arguments.

## Safe readiness check

This performs no conversion, upload, frontmatter edit, or network request:

```bash
python3 <skill-root>/scripts/publish_cover.py \
  /absolute/path/to/approved-cover.png \
  --check-only
```

Expected without a session: JSON status `blocked_authentication`,
`cookie_present: false`, and `outward_action_attempted: false`.

Expected after the environment variables are set: JSON status `ready`. Only
then, and only after explicit approval of the exact preview and explicit
authorization for the outward upload, run the live publish command.

`MEDIACLAW_UPLOAD_ENDPOINT` may override the production endpoint only for an
explicit local/staging test. Do not use an override as a fallback for a failed
production API upload.
