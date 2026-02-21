# Grok API Integration Guide

## Overview

This guide covers how to integrate xAI's Grok API into your application in a maintainable, config-driven way. The goal is to keep sensitive secrets in environment variables only, and move everything else — models, endpoints, rate limits, feature flags, prompt templates — into your database so they can be updated without deployments.

---

## Environment Variables (The Only Hardcoded Config)

The only things that belong in your `.env` file or secrets manager are:

- `GROK_API_KEY` — your xAI API key
- `GROK_API_SECRET` — if xAI introduces signing secrets in the future

Everything else described below lives in the database.

---

## Database Schema Design

### 1. `ai_providers`

This table acts as a registry of AI providers your app supports. Even if you only ever use Grok, this gives you a clean abstraction layer.

**Columns to include:** a unique identifier, a human-readable name (e.g. "xAI Grok"), the base API URL, whether the provider is currently active, and any global timeout or retry settings that apply to all calls to this provider. You can also store a notes field for internal documentation.

The base URL for Grok is `https://api.x.ai/v1` — storing it here means you can update it without touching code if xAI changes their domain or versioning.

---

### 2. `ai_models`

Each row represents a specific model version available from a provider.

**Columns to include:** a foreign key to `ai_providers`, the model identifier exactly as the API expects it (e.g. `grok-3`, `grok-3-mini`, `grok-2-vision-1212`), a friendly display name, the model's context window size in tokens, the maximum output tokens allowed, whether the model supports vision/image inputs, whether it supports function/tool calling, the per-token input cost and output cost (store as decimal, e.g. in millionths of a dollar to avoid floating point issues), whether the model is currently enabled in your app, and a deprecation date if applicable.

This table lets you swap models in your UI or logic by updating a database row rather than deploying code.

---

### 3. `ai_endpoints`

This table maps specific capabilities or features in your app to a model and a set of call parameters.

**Columns to include:** a slug or key that your application code references (e.g. `chat_completion`, `document_summary`, `code_review`), a foreign key to `ai_models`, the API path to call (e.g. `/chat/completions`), the HTTP method, default temperature, default max tokens, default top-p, whether streaming is enabled, and whether this endpoint is active.

Your application code should look up an endpoint by its slug and use whatever model and parameters are configured there. This means you can point `document_summary` at `grok-3-mini` today and switch it to `grok-3` tomorrow without a redeploy.

---

### 4. `ai_prompt_templates`

System prompts and user prompt templates should not be hardcoded in your application logic.

**Columns to include:** a slug your code uses to look up the template, a foreign key to `ai_endpoints` (optional — some templates may be shared), the system prompt text, an optional user prompt template with placeholder variables (e.g. `{{document_text}}`), a version number, whether this is the active version, and created/updated timestamps.

Versioning prompt templates lets you A/B test prompts or roll back to a previous version if quality degrades.

---

### 5. `ai_rate_limit_configs`

Grok's API has rate limits that vary by tier and model. Store these here so your retry/throttle logic reads from the database.

**Columns to include:** a foreign key to `ai_models`, requests per minute allowed, tokens per minute allowed, requests per day allowed, whether you want your app to enforce a lower internal limit than the API limit (useful to leave headroom), and the backoff strategy to use on 429 errors (e.g. `exponential`, `fixed`).

---

### 6. `ai_request_logs`

Every call to the Grok API should be logged. This gives you auditability, cost tracking, and debugging capability.

**Columns to include:** a foreign key to `ai_endpoints`, a reference to the user or session that triggered the request, the request timestamp, response timestamp, HTTP status code returned, prompt tokens used, completion tokens used, total tokens used, estimated cost for this call (computed from the model's per-token rates), whether the request succeeded, the error message if it failed, and a truncated or hashed version of the request payload for debugging (avoid logging full user content unless you have a legal basis to do so).

---

### 7. `ai_feature_flags`

Some Grok features — like function calling, streaming responses, or multi-turn memory — may be things you want to enable or disable per environment, per user tier, or per feature.

**Columns to include:** a flag name (e.g. `enable_streaming`, `enable_tool_use`, `enable_vision`), whether it's globally on or off, an optional foreign key to a user tier or role table if you want per-tier control, and a description field for internal documentation.

---

### 8. `ai_fallback_chains` (Optional but Recommended)

If you want resilience — e.g., fall back to `grok-3-mini` if `grok-3` is unavailable or over budget — define chains here.

**Columns to include:** a name for the chain, an ordered list of model references (you can implement this as a priority-ordered child table `ai_fallback_chain_models` with a foreign key to the chain and a priority integer), and a fallback trigger condition (e.g. `on_error`, `on_rate_limit`, `on_cost_exceeded`).

---

## How Your Application Should Use These Tables

**At startup or with a short cache TTL:** load the active models, endpoints, and feature flags into your application's memory. Refresh them periodically (every few minutes) so config changes propagate without restarts.

**When making an API call:** look up the endpoint by slug, retrieve its associated model identifier and default parameters, look up the active prompt template for that endpoint, merge in any runtime variables, build the request, call the Grok API using the key from your environment variable, log the result to `ai_request_logs`, and update any rate limit counters.

**For rate limiting:** before each call, check `ai_rate_limit_configs` for the model and compare against recent entries in `ai_request_logs`. This keeps your throttling logic data-driven rather than hardcoded.

---

## Grok API Specifics Worth Knowing

**Authentication:** Grok uses standard Bearer token auth. Your `GROK_API_KEY` goes in the `Authorization: Bearer` header on every request.

**Endpoint compatibility:** Grok's API is largely OpenAI-compatible, meaning the `/v1/chat/completions` request and response shape is nearly identical. If your app already has an OpenAI integration, you can often reuse the same HTTP client code and just change the base URL and API key — which is exactly why storing those in the `ai_providers` and environment variable rather than in code pays off.

**Streaming:** Grok supports server-sent events (SSE) streaming. Whether to stream should be a per-endpoint decision stored in `ai_endpoints`, not hardcoded.

**Models available as of early 2025:** `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`, `grok-2-vision-1212`, and `grok-2-image-1212` for image generation. Store all of them in `ai_models` even if you only activate a subset — this makes it easy to switch.

**Function/tool calling:** supported on most Grok models. The schema format is the same as OpenAI's tool_choice format. Store whether a given endpoint uses tool calling in `ai_endpoints` and keep your tool definitions in code or in a separate `ai_tool_definitions` table if you want them to be dynamic.

**Context windows:** vary significantly by model (`grok-3` supports 131k tokens). Having this in `ai_models` lets your app make intelligent decisions about chunking content before sending.

---

## Cost Management

With token costs stored in `ai_models` and every call logged in `ai_request_logs`, you can build a simple query to sum costs by user, by feature, by day, or by model — without any external tooling. Consider adding a `monthly_budget_usd` column to a user or tenant table and checking it before each call if cost control is important to your use case.

---

## Summary of Tables

| Table | Purpose |
|---|---|
| `ai_providers` | Registry of AI providers (Grok, etc.) and their base URLs |
| `ai_models` | Individual model versions with capabilities and pricing |
| `ai_endpoints` | Feature-to-model mappings with default call parameters |
| `ai_prompt_templates` | Versioned system and user prompts, keyed by slug |
| `ai_rate_limit_configs` | Per-model rate limit thresholds and backoff strategies |
| `ai_request_logs` | Full audit log of every API call with token usage and cost |
| `ai_feature_flags` | Runtime toggles for API features, optionally per user tier |
| `ai_fallback_chains` | Ordered model fallback sequences for resilience |
