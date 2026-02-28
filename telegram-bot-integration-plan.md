# Telegram Bot Integration Implementation Plan

## Overview
Add a new "Integrations" section to the project sidebar. The system will have one shared Telegram bot for the entire application, stored in a generic integrations table using JSONB for flexible configuration. Users will manage their personal Telegram chat connections (chat_ids) where the bot can contact them.

## Architecture Design
- **Shared Bot**: One Telegram bot serves all users across the application
- **Integrations Table**: Generic table using JSONB to store different integration types
- **User Chat Management**: Users configure which Telegram chats they want to receive notifications in
- **Bot Configuration**: Stored as integration type "telegram_bot" with bot token, username, API URL, etc.
- **Chat Management**: Users add/remove chat_ids for personalized bot interactions

## Current Architecture Analysis
- **Sidebar**: Implemented in `AppBar.tsx` (exported as `AppSidebar`)
- **Layout**: Uses flexbox layout in `AppLayout.tsx` with conditional sidebar rendering
- **Pages**: Follow Next.js App Router pattern with server/client component separation
- **Database**: Uses Supabase with SQL schema files for table definitions
- **Navigation**: Links in sidebar use Next.js `<Link>` components

## Step-by-Step Implementation

### 2. Add Integrations Section to Sidebar
**File**: `src/components/AppBar.tsx`
- Add new "Integrations" section header after existing navigation items
- Add Telegram Bot navigation item with appropriate icon (MessageCircle or Bot icon)
- Position it logically in the navigation menu (after Settings section)

### 3. Create Generic Integrations Table Schema
**File**: `src/data/create-integrations.sql`
- Create `ncm_integrations` table with:
  - `id` (UUID primary key)
  - `type` (varchar, e.g., "telegram_bot", "discord_bot", etc.)
  - `name` (varchar, human-readable name)
  - `description` (text, optional description)
  - `config` (JSONB, stores integration-specific configuration)
  - `config_schema` (text, JSON Schema describing the possible structure of the config for UI generation)
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` timestamps
- Add proper RLS policies (service role can manage integrations)
- Include indexes on type and is_active

**File**: `src/data/create-user-telegram-chats.sql`
- Create `ncm_user_telegram_chats` table with:
  - `id` (UUID primary key)
  - `user_id` (foreign key to user profiles)
  - `chat_id` (varchar, Telegram chat identifier)
  - `chat_title` (varchar, optional chat name for display)
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` timestamps
- RLS policies ensuring users can only manage their own chats
- Indexes for performance

### 4. Create Telegram Chat Management Page Structure
**File**: `src/app/integrations/telegram/page.tsx` (new)
- Server component following existing page pattern
- Auth check and redirect logic
- Basic page layout with title and description
- Import and render client component

**File**: `src/app/integrations/telegram/client.tsx` (new)
- Client component for managing user's Telegram chats
- Display list of user's connected chats
- Form to add new chat connections
- Ability to remove/disable chat connections
- Integration status display (shows if bot is configured)

### 5. Implement API Endpoints for Integration Management
**File**: `src/app/api/integrations/route.ts` (new)
- GET: Fetch all integrations (service role only)
- POST: Create new integration (service role only)

**File**: `src/app/api/integrations/[id]/route.ts` (new)
- GET: Fetch specific integration by ID
- PUT: Update integration configuration
- DELETE: Remove integration

**File**: `src/app/api/integrations/telegram/chats/route.ts` (new)
- GET: Fetch user's connected Telegram chats
- POST: Add new chat connection for user

**File**: `src/app/api/integrations/telegram/chats/[chatId]/route.ts` (new)
- DELETE: Remove user's chat connection
- PUT: Update chat connection (enable/disable)

### 6. Create API Endpoint for Sending Telegram Messages
**File**: `src/app/api/integrations/telegram/send/route.ts` (new)
- POST: Send message to specified Telegram chat
- Request body: `{ "chat_id": "string", "message": "string", "parse_mode": "optional" }`
- Validate that chat_id belongs to authenticated user (check user_telegram_chats table)
- Fetch bot token from integrations table (type: "telegram_bot")
- Make HTTP request to Telegram Bot API: `https://api.telegram.org/bot{token}/sendMessage`
- Handle rate limiting and error responses from Telegram API
- Return success/error status with Telegram API response

### 7. Update Navigation Routing
- Ensure new `/integrations/telegram` route is properly handled
- Test navigation from sidebar to new page
- Verify authentication redirects work correctly

### 9. Bot Configuration Setup
**Initial Setup Process**:
- JSONB structure: `{"bot_token": "encrypted_token", "bot_username": "@botname", "api_url": "https://api.telegram.org/bot", "webhook_url": "..."}`
- Bot configuration will be done directly in the database by admin.

### 10. Add Form Components for Chat Management
**Components needed**:
- Input field for Telegram chat_id (users get this from bot commands)
- Optional chat title/name field for display
- List of connected chats with enable/disable toggles
- Remove chat functionality
- Instructions for users on how to get their chat_id
- Integration status indicator (shows if bot is configured)
- Validation feedback and error handling

### 11. Implement Measures
- Input validation for chat_ids and configuration data
- Rate limiting for API operations
- Audit logging for integration changes

## File Structure Changes
```
src/
├── app/
│   ├── api/
│   │   └── integrations/
│   │           ├── route.ts
│   │           ├── [id]/
│   │           │   └── route.ts
│   │           └── telegram/
│   │               ├── send/
│   │               │   └── route.ts
│   │               └── chats/
│   │                   ├── route.ts
│   │                   └── [chatId]/
│   │                       └── route.ts
│   └── integrations/
│       └── telegram/
│           ├── page.tsx
│           └── client.tsx
├── components/
│   ├── AppBar.tsx (modify)
│   └── AppLayout.tsx (modify)
├── data/
│   ├── create-integrations.sql
│   └── create-user-telegram-chats.sql
```

## Success Criteria
- Sidebar shows new "Integrations" section with Telegram Bot link
- Clicking link navigates to user's chat management page
- Users can add/remove Telegram chats where they want bot notifications
- API endpoint allows sending messages to user's connected Telegram chats
- Generic integrations table supports bot configuration and future integrations
- config_schema field enables rendering of user-friendly UI elements for integration configuration