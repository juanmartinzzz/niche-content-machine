# LLM Data Model Strategy

## Core Tables

### Providers
- Store AI provider configurations (base URLs, timeouts, retry limits)
- Enable/disable providers globally
- Support multiple providers (OpenAI, Anthropic, etc.)

### Models
- Link to providers with specific model identifiers
- Track capabilities: context window, vision support, tool calling
- Store pricing: input/output costs per million tokens
- Enable/disable individual models
- Support deprecation dates

### Endpoints
- Map app features to specific models
- Define API paths and HTTP methods
- Set default parameters: temperature, max tokens, top-p
- Enable/disable endpoints individually
- Support streaming responses

### Prompt Templates
- Versioned prompt storage with active/inactive status
- Separate system prompts and user prompt templates
- Support placeholder variables in user prompts
- Optional structured output with JSON schemas
- Link to specific endpoints when needed

## Storage Strategy

### Relationships
- Providers → Models (one-to-many)
- Models → Endpoints (one-to-many)
- Endpoints → Prompt Templates (one-to-many, optional)

### Indexing
- Query by provider, model status, endpoint slugs
- Support version ordering for prompts
- Optimize for active records filtering

### Constraints
- Unique model identifiers per provider
- Versioned prompt uniqueness
- Structured output validation requirements

### Security
- Row-level security for service role access
- Automatic timestamp updates
- Referential integrity with cascade/restrict rules