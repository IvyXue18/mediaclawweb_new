---
name: publish-r2-media
description: "Publish a static asset (screenshot, image, video) to this project's Cloudflare R2 bucket behind media.mediaclaw.app — correct key convention and headers, byte-level verification, and the checks that avoid R2's cached-404 trap (where probing a key before upload makes the published URL 404 in browsers while HEAD reports 200). Use whenever an asset needs an https://media.mediaclaw.app/... URL: testimonial screenshots, docs images/video, anything referenced by absolute URL instead of committed under public/. Also use when an R2 URL 404s in the browser but wrangler says the upload succeeded."
argument-hint: "<local file> [r2 key]"
user-invocable: true
---

# Publish to R2 — $ARGUMENTS

Put one asset on `media.mediaclaw.app` and prove it actually serves.

No credentials to hunt for: `wrangler` in this repo is already OAuth-authenticated
to the Cloudflare account that owns the **`mediaclaw-media`** bucket, which is what
`media.mediaclaw.app` points at. **Do not ask the user for R2 keys** and do not go
looking in `/admin/settings` → Storage — the local DB has no `r2_*` rows. (Reading
wrangler's stored OAuth token to call the Cloudflare API directly is blocked by the
permission classifier; you don't need it for anything here.)

## The trap this skill exists for

`media.mediaclaw.app` is an R2 **custom domain**. A GET for a key that doesn't
exist returns a 404 that Cloudflare's edge caches (the 404 advertises
`cache-control: max-age=14400`, and it is cached per edge colo). Three things
measured the hard way on 2026-09-11:

- **Never `curl` a key to see if it's free before uploading.** That probe caches
  the 404 on the exact URL you're about to publish. The upload then succeeds,
  `wrangler` says "Upload complete", and the image still 404s in every browser.
  Check existence through `wrangler`, which reads R2 directly and caches nothing.
- **Never verify with `curl -I` / HEAD.** Against a poisoned URL, HEAD cheerfully
  returns `200 image/webp` with the right `content-length` while the GET that
  browsers actually make serves the cached 404 HTML. HEAD is not evidence — only
  a **GET with a byte comparison** is.
- **A poisoned URL recovers on its own, but not instantly and not on command.**
  Observed: still 404 immediately after upload, serving correctly a few minutes
  later; `max-age=14400` is the worst case, not the typical one. Fetching the URL
  once with a `?cachebust=` query proves the object at origin is right, but does
  **not** dependably flip the bare URL (tested directly — the bare URL kept
  returning the cached 404 straight afterwards). There is no client-side purge:
  the token-based Cloudflare purge API is blocked by the permission classifier.

So if a freshly published URL 404s: **do not re-upload and do not panic.** Confirm
the object at origin, wait a few minutes, re-check. Escalate to a dashboard purge
only if it persists.

## Run it

```bash
python3 .claude/skills/publish-r2-media/scripts/publish_r2_media.py \
  --file /path/to/asset.png \
  --key testimonials/2026/29-solo-built-consulting.webp \
  --webp
```

The script does the whole safe sequence: `wrangler`-based existence check (refuses
to clobber an existing key without `--force`) → optional `cwebp` conversion →
`wrangler r2 object put` with the project's standard headers → GET the bare URL and
compare sha256 against the local bytes → on failure, a `?cachebust=` origin probe
to tell a stale edge cache apart from a genuinely bad upload. It prints JSON:

| `status` | Meaning |
| --- | --- |
| `published` | The public URL serves the right bytes. Done. |
| `published_edge_cache_stale` | Object is correct in R2; the URL is serving a cached 404. Wait a few minutes and re-GET — **do not re-upload**. Say so rather than reporting success. |
| `uploaded_but_unverified` | Origin didn't return the expected bytes either. Real problem. |
| `blocked` | Refused before any outward action (bad path, key taken, missing `cwebp`). |

`--check-only` reports whether the key is free and touches nothing outward. Use it
before an upload the user hasn't explicitly greenlit.

## Key conventions

Keys become public URL segments, so ASCII only — never a Chinese working filename.

| Asset class | Key shape | Example |
| --- | --- | --- |
| Testimonial screenshots | `testimonials/<year>/<NN>-<ascii-slug>.webp` | `testimonials/2026/29-solo-built-consulting.webp` |
| Docs images | `docs/<group>/<slug>/<NN>.webp` | `docs/settings/faq/05.webp` |
| Docs video | `videos/docs/<group>/<slug>/<NN>-<ascii-slug>.mp4` | `videos/docs/collect/single-post/01-demo.mp4` |
| Standalone/demo video | `videos/<name>-<YYYYMMDD>.mp4` | `videos/mediaclaw-demo-20260424.mp4` |

`<NN>` continues the existing numbering for that set — read the manifest or list
the prefix first, don't guess. Standard headers (the script sets these): the real
content type, `content-disposition: inline`, and
`cache-control: public, max-age=31536000, immutable`, matching every object
already in the bucket.

## Finding the file the user pasted

Testimonial and docs screenshots usually arrive pasted into chat from WeChat, with
no path given. The image in the conversation exists on disk — look here before
asking the user to save it somewhere:

```bash
find ~/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files \
  -newermt "$(date -v-1d +%Y-%m-%d)" \( -iname '*.png' -o -iname '*.jpg' \) 2>/dev/null
```

`temp/ScreenShot_<date>_<time>.png` is the raw grab; `temp/InputTemp/<uuid>.png` is
the version after WeChat's own editing — **that's the one with the avatars
mosaicked**, and usually what the user actually sent. Same pixel dimensions, so
compare file size (the mosaicked one is smaller) and read both to confirm which
matches the attachment. **Publish the mosaicked version** — the raw one exposes
real people's profile photos on a public marketing page. Also check
`~/Library/Application Support/Claude/pending-uploads/` for attachments from other
sources.

## Images: convert first

Convert screenshots to WebP before upload (`--webp`, or `cwebp -q 88` by hand) —
repo convention, and raw PNG screenshots run multi-MB. Record the **real pixel
dimensions** wherever the asset gets referenced (`sips -g pixelWidth -g pixelHeight`),
not the display size; the testimonial wall and docs components both use them for
layout and CLS.

## After publishing

1. Point the reference at the absolute `https://media.mediaclaw.app/...` URL
   (testimonial wall: `src/content/testimonial-wall.ts`; docs: the page's `src` prop).
2. Delete the local copy under `public/` and remove the directory if it's now
   empty — an asset should live in exactly one place.
3. `node scripts/check-static-images.mjs` then `pnpm build`.
4. Confirm in the browser that the image really renders — `naturalWidth > 0`, not
   just "the element is in the DOM". A poisoned URL looks fine in the markup.

## When an existing R2 URL 404s in the browser

Almost always the cached-404 trap, not a bad upload. First establish where the
problem is — origin or edge:

```bash
npx wrangler r2 object get mediaclaw-media/<key> --file /tmp/check --remote
curl -s -o /tmp/live "https://media.mediaclaw.app/<key>?cachebust=$(date +%s)"
shasum -a 256 /tmp/check /tmp/live   # must match — if so, R2 is fine
curl -sD - -o /dev/null "https://media.mediaclaw.app/<key>" | head -3
```

Matching hashes mean the object is correct and only the edge is stale. **Do not
re-upload** — it changes nothing, since the bad entry is on the URL, not the
object. Wait a few minutes and re-run the last command; in both observed cases the
bare URL started serving correctly within roughly five minutes, well short of the
advertised 4-hour TTL. The 404 is cached per edge colo (`cf-ray`'s trailing
segment), so a check from one location isn't the whole picture.

If it persists, the only deterministic fix is a purge, which needs the user:
Cloudflare dashboard → the `mediaclaw.app` zone → Caching → Configuration →
Purge Cache → Custom Purge → by URL. Ask them; don't go looking for an API token
(reading wrangler's stored OAuth credential is blocked, by design).

## Related

- `docs-media` — the full per-page docs pipeline (captions, components, wiring);
  it calls this publish step for video and for pages served from R2.
- `create-mediaclaw-blog-cover` — blog covers go through the authenticated
  `/api/storage/upload-image` route instead, which mints `uploads/<md5>.<ext>`
  keys. That route **cannot** produce the prefixed keys above, which is why
  testimonials and docs media use `wrangler` directly.
