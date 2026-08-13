---
name: Claude brain builder scope
description: Anthropic/Claude is ONLY for building/improving agent system prompts, never daily chat
---
Business decision (Aug 2026): ANTHROPIC_API_KEY is reserved for "membangun otak" — generating/improving agent system prompts. Daily chat stays on model-router (OpenAI/DeepSeek/Qwen/Gemini).

**Why:** cost control (Claude premium, one-time design work vs per-message chat) + no behavior change for existing customer-facing chat.

**How to apply:**
- Helper: `server/lib/anthropic.ts` (raw fetch, no SDK — avoids esbuild ESM allowlist issue). Model env-overridable via ANTHROPIC_MODEL, default claude-sonnet-4-5.
- Endpoints: POST /api/agents/generate-brain (new agents, isAuthenticated) and POST /api/agents/:id/improve-brain (preview-only, assertCanMutateAgent; save still via PATCH). Improve prompt MUST preserve marker blocks (FEDERATION_MODE v2, SYNTHESIS ORCHESTRATOR, SCORECARD).
- Existing agents are improved one-by-one with admin preview/approval — never bulk-automatic (sold clones must not shift behavior). User confirmed (Aug 2026): default usage = NEW chatbots only; existing chatbots stay as-is unless admin explicitly uses the improve button.
- Key status: stored ANTHROPIC_API_KEY is INVALID (user pasted strings "given by an agent"; valid key = sk-ant-api03-, needs console.anthropic.com credits). Per explicit user request, callClaude falls back to Claude via OpenRouter (existing OPENROUTER_API_KEY, model anthropic/claude-sonnet-4.5) when the Anthropic key is missing or 401/403 — this fallback is intentional, don't "fix" it away; re-test direct Anthropic when user supplies a real key.
