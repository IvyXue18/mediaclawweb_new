---
name: create-mediaclaw-blog-cover
description: "Create or restyle MediaClaw blog covers through a mandatory review-first workflow: generate editable 1600x900 HTML and a PNG preview, pause for explicit user approval of copy and image layout, then convert to WebP, upload through the authenticated MediaClaw image API to R2, and write the verified link to the matching blog frontmatter. Use when a user asks for a MediaClaw blog cover, cover revision, R2 publication, or blog image attachment."
---

# Create MediaClaw Blog Cover

Create the source HTML first. Treat the rendered image as an export, not the
source of truth, so later style changes stay targeted and editable.

## Gather inputs

1. Read the complete article, including frontmatter.
2. Reuse real article screenshots. Prefer two or three images that prove the
   article's main workflow; never invent product UI.
3. Read [references/visual-system.md](references/visual-system.md) before
   changing the default visual direction.
4. Resolve the website root with `git rev-parse --show-toplevel`. Confirm that
   `src/content/posts`, `src/routes/api/storage/upload-image.ts`, and
   `package.json` exist there.
5. Read [references/r2-publish-preflight.md](references/r2-publish-preflight.md)
   before publishing. This repository-local copy owns the upload contract; do
   not depend on a separate content-ops manifest.

## Resolve runtime paths

Treat the directory containing this `SKILL.md` as `<skill-root>`. Do not assume
the caller's current working directory contains the skill scripts.

The renderer needs either `@playwright/test` or `playwright`. Pass
`--module-root` with the absolute path of a project that provides one of those
packages. For this repository-local skill, use the website root resolved above.

## Write the cover copy

Derive copy from the article rather than copying its metadata mechanically:

- `eyebrow`: one product capability or scenario, 4-10 Chinese characters.
- `title`: one concrete promise, preferably 12-24 Chinese characters. Break it
  into at most three lines and accent only the decisive phrase.
- `description`: one sentence explaining what becomes easier or more useful,
  normally 24-46 Chinese characters.
- `tags`: two or three short output or workflow labels. Do not repeat the title.

Keep the title truthful to the body. Do not add unsupported numbers, outcomes,
or platform capabilities.

## Phase 1: Generate a review preview

Run:

```bash
python3 <skill-root>/scripts/create_cover.py \
  --article /absolute/path/to/post.zh.mdx \
  --output /absolute/path/to/cover.html \
  --title "从对标内容到自己的初稿" \
  --accent "10 分钟" \
  --eyebrow "AI 内容工作流" \
  --description "拆解对标、扩展选题，再按账号风格生成可编辑初稿" \
  --images image-1.png image-2.png image-3.png
```

The explicit copy arguments are preferred. Without them, the script falls back
to frontmatter and body-derived values; inspect and refine those values before
delivery.

Render the editable HTML:

```bash
node <skill-root>/scripts/render_cover.mjs \
  --module-root /absolute/path/to/playwright-project \
  /absolute/path/to/cover.html \
  /absolute/path/to/cover.png
```

Inspect the PNG at full size, then show it to the user. Ask the user to review:

- title, accent phrase, description, and tags
- screenshot selection, order, scale, overlap, and cropping
- overall visual direction

Stop after presenting the preview. Do not run `publish_cover.py`, upload any
asset, convert the preview to the final WebP, or edit blog frontmatter in this
phase.

## Approval gate

Proceed only after the user explicitly approves the current preview with wording
such as “确认”, “用这版”, “可以上传”, or an equally clear instruction.

Requests for changes, partial approval, silence, or a request to “先看看” do not
count as approval. Apply the requested changes, render a new PNG preview, show
it again, and stop at the same gate.

## Phase 2: Publish the approved cover

After explicit approval, convert the approved PNG to WebP, upload it through the
authenticated project API, verify the returned R2 object, and print the final
link.

The API path is mandatory for blog covers:

- Send `POST https://mediaclaw.app/api/storage/upload-image` as
  `multipart/form-data` with the file in the `files` field.
- Authenticate with a Better Auth session cookie supplied only through
  `MEDIACLAW_UPLOAD_COOKIE`.
- Never open an admin/backend uploader, ask the user to upload manually, call
  `wrangler r2 object put`, or commit a `public/` fallback instead.
- If authentication, the API, or R2 verification is blocked, report that exact
  blocker and stop. Do not silently change the publication mechanism.

First read
[references/r2-publish-preflight.md](references/r2-publish-preflight.md) and
run the no-network readiness check. If it reports `blocked_authentication`,
stop and tell the user to sign in at `https://mediaclaw.app/sign-in` and set the
Better Auth session cookie in the local environment variable. Signing in is
only for API authentication; do not navigate to the admin uploader. Do not
attempt the upload without the cookie.

```bash
export MEDIACLAW_UPLOAD_COOKIE='better-auth.session_token=...'
python3 <skill-root>/scripts/publish_cover.py \
  /absolute/path/to/cover.png \
  --output /absolute/path/to/cover.webp
```

The command emits one JSON object containing `webp`, `url`, and `bytes`. Return
the value of `url` to the user. The command intentionally fails when the API
falls back to a relative local `/uploads/...` URL; configure R2 and retry rather
than presenting a local path as an R2 result.

Write the verified `url` into the matching blog post's `image` frontmatter.
Preserve the article's existing formatting and change only that field unless the
user requested other edits.

## Revise a direction

Modify CSS variables in the generated HTML before restructuring markup:

- `--paper`, `--ink`, `--muted`: overall tone
- `--accent`, `--accent-soft`: brand emphasis
- `--radius`, `--shadow`: geometric character
- `.visual-stage`, `.shot-*`: right-side composition

Preserve the copy/visual split and the 16:9 canvas unless the user explicitly
requests a new format. Change one visual axis at a time so feedback remains
actionable.

## Attach and verify

1. Keep the final HTML beside the working artifact or in an agreed design-source
   directory; do not commit scratch renders.
2. Present the PNG preview and wait for explicit user approval.
3. After approval, convert the exact approved preview to WebP and upload it to
   R2.
4. Return the verified absolute R2 URL to the user.
5. Update the matching post's `image` frontmatter only after upload succeeds.
6. Verify the image URL returns `200` or `206` with an image content type.
7. Verify the rendered blog route contains the same R2 URL.
8. Verify both the blog card and detail hero show the full 16:9 cover without
   cropping.
9. Inspect the rendered image at full size. Check text wrapping, screenshot
   legibility, edge clearance, and overlap hierarchy.

## Quality gates

- Before approval, produce only editable HTML and a reviewed PNG preview.
- Never upload, publish, or modify blog frontmatter before explicit user
  approval of the current preview.
- After approval, produce WebP, a verified absolute R2 URL, and the matching
  blog `image` frontmatter update.
- Use 1600x900 unless another target is requested.
- Keep all essential text inside an 80px safe area.
- Use real product screenshots and keep their UI recognizable.
- Use at most one accent gradient and one italic emphasis treatment.
- Do not place article copy over the screenshots.
- Do not declare completion from a successful render alone; inspect the image
  and verify the page presentation.
- Do not return a relative `/uploads/...` path or an unverified upload response.
- Do not replace the authenticated image API with an admin UI, direct R2 CLI,
  or repository-local image fallback.
