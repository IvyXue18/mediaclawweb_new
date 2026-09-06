---
name: docs-media
description: "Process real screenshots/recordings for one finalized /docs tutorial page: convert images to WebP, upload video to Cloudflare R2 (media.mediaclaw.app), wire bilingual (zh/en) captions into the doc's image/video components, verify build. Use when the user says a specific docs page's media is ready ('这篇写完了', '素材配置好了', 'process this section') — operates on exactly one page per invocation, never a batch of drafts."
argument-hint: "<doc slug, e.g. getting-started/install>"
user-invocable: true
---

# Docs Media — $ARGUMENTS

Wire real screenshots/recordings into **one** finalized `/docs` tutorial page and optimize them. This is the processing half of the pipeline — the user has already written the tutorial prose and dropped raw media files into place; this skill converts/uploads/wires/translates.

**Hard rule: one page per run.** Only touch the page named in `$ARGUMENTS`. Do not sweep other pages that also have unprocessed media, even if it would be convenient to batch — a past run that pre-wrote content (captions) for every draft page before it was finalized had to be fully reverted. Wait to be invoked again for the next page.

## Step 0 — Resolve the target page

`$ARGUMENTS` is a doc slug like `getting-started/install`. Find its source at `src/content/docs/<slug>.mdx` (or locale variants `<slug>.zh.mdx` / `<slug>.en.mdx` if present — see the loader in `src/routes/docs/$.tsx`). If nothing matches, list close candidates under `src/content/docs/` and ask rather than guessing.

## Step 1 — Re-check the current component shape (don't trust this doc)

Component names and props for doc media have changed across sessions before (`ImagePlaceholder`/`VideoPlaceholder` → `DocImage`/`DocVideo`, then bilingual `captionEn` support added). Before doing anything:

1. Read `src/components/mdx-components.tsx` and `src/components/docs/platform-example-tabs.tsx` fresh.
2. Identify whichever tags the target mdx file actually uses for images/video/platform-tabs right now.
3. Check whether those components already accept an English caption prop (`captionEn`, `xiaohongshuCaptionEn`/`douyinCaptionEn`). If not, add it, following the existing pattern in that file: locale-switch via `import { getLocale } from '@/paraglide/runtime.js'` and `const text = getLocale() === 'en' ? (captionEn ?? caption) : caption`, used for both the `alt`/rendered caption text. `baseLocale` is `zh` (`project.inlang/settings.json`).
4. If the target page's media tags are still the dashed-placeholder variant (no `src` support at all, e.g. legacy `ImagePlaceholder`/`VideoPlaceholder`) while the codebase also has a real-media variant (currently `DocImage`/`DocVideo`), swap the tag name for that page's occurrences to the real-media variant, carrying the existing `caption` text over unchanged.

## Step 2 — Inventory the page's media slots

Scan the target mdx file top-to-bottom for every image/video/platform-tab tag. Note, in order: tag type, existing `caption`(s), existing `src` (if any local placeholder path was already wired by the user).

## Step 3 — Inventory the local media folder

Local folder convention: `public/imgs/docs/<slug>/` — mirrors `src/content/docs/<slug>.mdx` exactly. The folder exists only once a page has real screenshots (whoever added them created it); there are no pre-created empty folders or `.gitkeep` placeholders. If this page's folder doesn't exist yet, the user just dropped raw files somewhere — check the mdx for a wired `src` path, or ask. Naming convention the user follows when dropping files in:

- Two-digit prefix = position of that slot on the page, top-to-bottom (`01-`, `02-`, ...).
- Free-form description after the number.
- `-xiaohongshu` / `-douyin` suffix for the two files belonging to one `PlatformExampleTabs` slot.
- Image extension doesn't matter (png/jpg/webp); video is `.mp4`. An optional `NN-poster.*` is a video's static thumbnail (not required).
- **Two or more files sharing the identical leading number are ONE slot, not separate ones** — e.g. `01-收藏到选题库.png` + `01-选题库.png`, or three files all prefixed `01-`. That number designates a single point on the page where those files render together side by side as one `DocImageGrid` (not stacked separate `DocImage` tags, and not split across different sections even if their content superficially maps to different paragraphs). Confirmed 2026-09-04 after an initial pass treated every file as its own sequential slot and scattered a same-numbered pair across two sections — the user corrected it: "编号相同的两个素材应该并列". Only distinct numbers are distinct top-to-bottom positions.

Match files to slots by the leading number, grouping same-numbered files into one grid slot per the rule above. If the file count doesn't match the slot count (after grouping), or numbering is ambiguous, stop and ask — don't guess a mapping.

## Step 4 — Process images

For each non-video file matched to a slot:

1. Check width: `sips -g pixelWidth <file>`.
2. If wider than ~1600px (typical for full-resolution/retina screenshots), downscale while converting: `cwebp -q 85 -resize 1600 0 <input> -o <output>.webp`. Otherwise just convert: `cwebp -q 90 <input> -o <output>.webp`. (`cwebp` is on PATH; `sharp` is also available as a project dependency if a script is preferred over the CLI.)
3. Wire the resulting `/imgs/docs/<slug>/<name>.webp` path into the slot's `src` (or `xiaohongshuSrc`/`douyinSrc`).
4. Delete the original raw file once the `.webp` is confirmed referenced in the mdx.

Expect large wins — a typical 2.5–3 MB retina PNG screenshot lands around 150 KB as WebP with no visible quality loss (verified with `Read` on the resulting webp before deleting the original, when in doubt).

**Hard rule: never batch the `cwebp` conversions and the `rm` of the originals into one command call.** Run conversions, then run `ls` on the output directory and confirm every expected `.webp` file actually exists (non-zero size), and only then issue a separate `rm` call for the originals. This is not optional caution — it's a lesson from a real incident (2026-08-09, `viral-research/recent-hits`): a batched call had its `rm` line flagged by the sandbox's dangerous-command check, which blocked the **entire** call atomically (none of the `cwebp` lines executed either, even though they looked safe and came first). The wrong conclusion ("the rm failed, but the conversions before it must have run") led to issuing `rm` again on the *sources* in a follow-up call, which succeeded and permanently deleted the only copies before any `.webp` existed. Command-line `rm` does not go through the macOS Trash — there is no undo. Treat a blocked/errored command as "assume nothing in that call ran" and re-verify state from scratch, never as "everything except the flagged line probably ran."

## Step 5 — Process video (upload to R2, no credentials needed)

Video must never stay committed under `public/` — it's large and this project hosts tutorial/demo video on Cloudflare R2 instead (see the existing `https://media.mediaclaw.app/videos/mediaclaw-demo-20260424.mp4` referenced across `src/content/posts/*.mdx`).

**Do not ask the user for R2 access keys.** The admin-panel `/admin/settings` → Storage → R2 fields are a dead end for this — the local DB has no `r2_*` rows configured. The real mechanism: `wrangler` in this repo is already OAuth-authenticated to the Cloudflare account that owns an R2 bucket named **`mediaclaw-media`** (confirmed 2026-07-30 — this is what `media.mediaclaw.app` points at). Upload directly:

```bash
npx wrangler r2 object put "mediaclaw-media/videos/docs/<slug>/<NN>-<ascii-slug>.mp4" \
  --file="public/imgs/docs/<slug>/<NN-original-filename>.mp4" \
  --content-type="video/mp4" \
  --remote
```

Use a short ASCII slug for the key (translate the description) rather than reusing the Chinese local filename — the key becomes a public URL segment. Verify before wiring it in:

```bash
curl -sI "https://media.mediaclaw.app/videos/docs/<slug>/<NN>-<ascii-slug>.mp4"
```

Expect `HTTP/2 200` and a `content-length` matching the local file size. Then wire that full URL into the slot's `src` and delete the local mp4.

## Step 6 — Bilingual captions

For every slot, if it doesn't already have a real (non-placeholder-looking) English caption, write one: a natural, concise English translation of the existing Chinese `caption`, added as `captionEn` (or `xiaohongshuCaptionEn`/`douyinCaptionEn` for platform-tab slots). Don't touch a `captionEn` that's already present and looks intentional.

## Step 7 — Verify

Run `pnpm build` and confirm it passes — but a passing build only proves the MDX/TSX compiles, it says nothing about how the images actually render. **Also load the page in a browser and visually confirm every wired image fits inside the article's text column** (same width as the paragraph text, not spilling wider and crowding the "本页目录" TOC sidebar on the right). Start (or reuse) the dev server, navigate to `/docs/<slug>`, and screenshot or snapshot the page. This has broken before: `DocImage`'s `width` prop is meant to be paired with `height` purely as an intrinsic-size/CLS hint, capped to the column by the `max-w-full` class — but a wide `width` value (e.g. a full-resolution 1600px screenshot) has previously overflowed past the column when something on the `<img>` fought that class (see `src/components/mdx-components.tsx`'s `DocImage`). Don't assume passing the same `width`/`height` numbers you read from `sips`/`cwebp` output is automatically safe — check the rendered result.

Report back concisely: what was converted/uploaded, size-reduction numbers for images, the final R2 URL(s) for any video, confirmation the local raw files were deleted, and confirmation the images render at column width (not oversized) in the browser check.
