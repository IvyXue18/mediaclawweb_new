# AI Task Activity Migration Slice

## Old Source References

- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/activity/ai-tasks/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/activity/ai-tasks/[id]/refresh/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/shared/models/ai_task.ts`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/shared/services/ai.ts`

## Migrated Targets

- `src/routes/activity/ai-tasks.tsx`
- `src/routes/activity/ai-tasks/$id/refresh.tsx`
- `src/routes/api/ai/tasks.ts`
- `src/routes/api/ai/query.ts`
- `src/modules/ai-tasks/service.ts`

## Behavior Restored

- `/activity/ai-tasks` is no longer a placeholder link page.
- The activity page shows the old task-table surface:
  - prompt
  - media type
  - provider
  - model
  - status
  - cost credits
  - result
  - created time
  - refresh action for pending or processing tasks
- Media tabs match the old page: all, music, image, video, audio, text.
- Status tabs add a migration QA affordance for pending, processing, success, and failed tasks.
- Result rendering handles old taskInfo shapes:
  - `errorMessage` as a destructive inline error
  - `songs[].audioUrl` as audio controls
  - `images[].imageUrl` as thumbnails
  - `videos[].videoUrl` as external links
  - `taskResult` fallback as compact JSON
- `/activity/ai-tasks/:id/refresh` now calls `/api/ai/query`, surfaces success or provider/config errors, and returns to the task list after a successful sync.
- `/api/ai/query` now persists status changes even when taskInfo is unchanged, preserving provider state transitions.

## Test Hooks

- `data-ai-task-page`
- `data-ai-task-tabs="media"`
- `data-ai-task-tabs="status"`
- `data-ai-task-error`
- `data-ai-task-refresh`
- `data-ai-task-refresh-page`
- `data-ai-task-refresh-success`
- `data-ai-task-refresh-error`
- `data-ai-task-result-error`
- `data-ai-task-result-audio`
- `data-ai-task-result-image`
- `data-ai-task-result-video`
- `data-ai-task-result-json`

## Remaining Gap

This slice restores the user-facing task activity and refresh surfaces, but does not prove real third-party provider credentials, callback notifications, or long-running media generation in production. Those remain part of the broader AI/chat closure.
