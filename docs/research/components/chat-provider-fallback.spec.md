# AI Chat Provider Fallback

## Source Baseline

- Old website chat API: `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/api/chat/route.ts`
- Old backend provider fallback: `/Users/xueyangchun/Desktop/Projects/mediaclaw/mediaclaw-backend/src/shared/services/monitor_ai.ts`
- Old backend compatible client: `/Users/xueyangchun/Desktop/Projects/mediaclaw/mediaclaw-backend/src/shared/services/monitor_ai_client.ts`

## Migrated Surface

- `src/modules/chat/provider.ts`
- `src/routes/api/chat.ts`
- `src/routes/api/chat/new.ts`
- `src/modules/config/settings.ts`
- `src/config/index.ts`

## Behavior

- Chat routing now supports `openrouter`, `kimi`, and `deepseek`.
- Provider order is resolved from the chat's stored provider, `chat_ai_provider`, `monitor_ai_provider`, configured fallback lists, then any configured provider with an API key.
- OpenRouter uses the selected UI model directly.
- Kimi and DeepSeek use direct-provider model names; `deepseek/deepseek-r1` maps to `deepseek-reasoner`.
- Non-stream and stream requests both use the same provider fallback resolver before a response body is opened.
- Assistant messages persist the provider/model that actually responded, plus attempt metadata.
- Admin Settings now exposes Chat AI Routing, OpenRouter, Kimi, and DeepSeek configuration.
- Stream responses start with a `meta` SSE event containing the provider/model that actually responded and the full fallback attempt list.
- `/chat/:id` displays the actual provider/model beside assistant messages and shows a compact fallback summary when the primary provider fails before a fallback succeeds.

## Test Hooks

- `tests/p1/chat-provider-fallback.test.ts`
- `tests/p1/chat-route-provider-fallback.test.ts`

## Remaining Acceptance

- Run `/chat` with real OpenRouter/Kimi/DeepSeek keys and verify a successful streamed answer.
- Confirm the visible fallback summary under a real provider failure, not only mocked provider responses.
- Continue visual parity work against the old `ChatBox`, `ChatInput`, `ChatMessages`, and AI SDK UI message behavior.
