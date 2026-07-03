# Chat Composer And Messages Specification

## Overview

- Target file: `src/routes/-legacy-action-pages.tsx`
- Source references:
  - old repo `src/shared/blocks/chat/input.tsx`
  - old repo `src/shared/blocks/chat/messages.tsx`
  - old repo `src/shared/blocks/chat/follow-up.tsx`
- Interaction model: text entry + model selection + reasoning toggle + streaming assistant response.

## DOM Structure

- Chat shell keeps a persistent left sidebar on desktop and a compact header on mobile.
- Start screen contains centered title and `ChatComposer`.
- Detail screen contains:
  - sticky chat header
  - scrollable message list
  - fixed-width bottom `ChatComposer`
- `ChatComposer` contains:
  - textarea body
  - footer toolbar
  - icon-only reasoning toggle with tooltip and pressed state
  - compact model select
  - icon-only submit button with loading state
  - inline error/status area

## Restored Source Styles

- Composer container: rounded, bordered, shadowed prompt-input shell.
- Textarea: borderless, transparent, no focus ring, large touch target.
- Footer: top border, compact toolbar layout, wrapping on mobile.
- Reasoning control: icon-first toggle; active state uses primary color and tinted background.
- Model control: compact select rather than full native select.
- Submit control: icon-only button; loader while sending.
- Assistant error state: visible assistant-side message with destructive color and retry affordance.

## States And Behaviors

- Empty input: submit disabled.
- Sending: submit shows spinner; textarea remains visible.
- Reasoning toggle: click switches `aria-pressed` and submitted payload.
- Model select: changing the selected model updates submitted payload.
- Stream failure: error is shown inline in the conversation and the composer, not only in a toast.
- Assistant message: copy action is exposed for persisted and streaming assistant text.

## Regression Hooks

- `data-chat-composer`
- `data-chat-composer-error`
- `data-chat-reasoning-toggle`
- `data-chat-model-trigger`
- `data-chat-submit`
- `data-chat-message`
- `data-chat-assistant-error`
- `data-chat-copy-message`

## Remaining Gap

This slice does not reintroduce the full old `@ai-sdk/react` UI message protocol or all old `ai-elements` primitives. It restores the visible composer controls, assistant message actions, and inline error recovery while preserving the current TanStack API route and SSE flow.
