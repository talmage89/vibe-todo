# Session Management Migration Guide

## Overview

This document describes the session management implementation added in PR #[TBD]. The implementation provides secure, database-backed sessions with cryptographically signed tokens.

## Database Changes

### New Session Model

A new `Session` model has been added to the Prisma schema:

```prisma
model Session {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  token     String   @unique
  expiresAt DateTime
  userAgent String?
  ipAddress String?

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}
```

### Migration Required

After pulling this change, you must run:

```bash
bunx --bun prisma migrate dev
```

This will create and apply the migration to add the `sessions` table.

## Features Implemented

### 1. Secure Session Tokens

- Cryptographically secure random tokens (32 bytes)
- HMAC-SHA256 signatures using `SESSION_SECRET`
- Base64url encoding for URL safety
- Includes timestamp in token structure

### 2. Database-Backed Sessions

- Sessions stored in database for server-side invalidation
- Automatic expiry checking on validation
- Cleanup utility for expired sessions
- User agent and IP address tracking for security

### 3. Session Management API

#### Creating Sessions

```typescript
import { createSession } from "~/platform/auth";

const sessionCookie = await createSession(userId, {
  userAgent: request.headers.get("user-agent"),
  ipAddress: request.headers.get("x-forwarded-for"),
});

cookie.session?.set(sessionCookie);
```

#### Validating Sessions

```typescript
import { getSessionFromContext, validateSession } from "~/platform/auth";

// From Elysia context
const session = await getSessionFromContext(context);

// From token directly
const session = await validateSession(token);
```

#### Logout

```typescript
import { deleteSession, deleteAllUserSessions } from "~/platform/auth";

// Delete single session
await deleteSession(token);

// Delete all user sessions (e.g., "logout everywhere")
await deleteAllUserSessions(userId);
```

### 4. OAuth Token Refresh

Automatic refresh of OAuth access tokens when they expire:

```typescript
import { refreshAccountTokenIfNeeded, getValidAccessToken } from "~/platform/auth";

// Refresh if needed
const wasRefreshed = await refreshAccountTokenIfNeeded(accountId);

// Get valid token (refreshes if needed)
const accessToken = await getValidAccessToken(accountId);
```

### 5. Logout Endpoint

A new `POST /auth/logout` endpoint has been added:

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Cookie: session=..."
```

## Security Features

### Session Cookies

Sessions use HTTP-only cookies with the following security settings:

- `httpOnly: true` - Prevents JavaScript access
- `sameSite: "strict"` - CSRF protection
- `secure: true` (production only) - HTTPS only
- `maxAge: 30 days` - Session lifetime

### Token Structure

Session tokens have the following structure:

```
{base64url_random}.{timestamp}.{hmac_signature}
```

This provides:
- Randomness for unpredictability
- Timestamp for additional entropy
- HMAC signature for integrity verification

### Automatic Cleanup

The `cleanupExpiredSessions()` function can be run periodically to remove expired sessions from the database.

## Environment Variables

Ensure `SESSION_SECRET` is set in your environment:

```bash
# .env.local
SESSION_SECRET=your-secret-key-at-least-32-characters-long
```

Generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Breaking Changes

### Cookie Value Format

**Before:** Cookie value was plain `userId`
**After:** Cookie value is a signed session token

Existing sessions will be invalidated after this update. Users will need to log in again.

## Usage in Routes

### Protected Routes (Future)

The session management utilities are designed to be used with authentication middleware (to be implemented in a separate PR):

```typescript
// Future usage example
app.get("/api/tasks", async (context) => {
  const session = await getSessionFromContext(context);

  if (!session) {
    context.set.status = 401;
    return { error: "Unauthorized" };
  }

  // Use session.userId to fetch user data
  const tasks = await db.task.findMany({
    where: { userId: session.userId },
  });

  return tasks;
});
```

## Testing Checklist

- [ ] Users can log in via Google OAuth
- [ ] Sessions persist across browser restarts (within 30 days)
- [ ] Sessions expire after 30 days
- [ ] Logout endpoint clears session
- [ ] Invalid session tokens are rejected
- [ ] Expired sessions are automatically deleted on validation
- [ ] OAuth tokens are refreshed when expired
- [ ] User agent and IP are tracked in sessions

## Maintenance

### Periodic Cleanup

Consider running session cleanup periodically (e.g., daily cron job):

```typescript
import { cleanupExpiredSessions } from "~/platform/auth";

// In a cron job or scheduled task
const deletedCount = await cleanupExpiredSessions();
console.log(`Cleaned up ${deletedCount} expired sessions`);
```

## References

- [Prisma Schema](../prisma/schema.prisma)
- [Session Implementation](../src/platform/auth/session.ts)
- [Token Refresh Implementation](../src/platform/auth/token-refresh.ts)
- [Logout Implementation](../src/platform/auth/logout.ts)
