# @nauticalstream/sdk - Environment Compatibility Guide

## ✅ Verification Complete

The SDK now works in **both Node.js microservices AND browser applications** (SvelteKit, React, Vue, etc.) with zero breaking changes.

## How It Works

### Conditional Exports
The package.json uses Node.js conditional exports to serve different code based on the environment:

```json
{
  "exports": {
    ".": {
      "node": "./dist/index.js",           // Full SDK for Node.js
      "default": "./dist/browser-index.js"  // Browser-safe SDK
    },
    "./telemetry": {
      "node": "./dist/telemetry/index.js",
      "default": "./dist/telemetry/browser-stub.js"  // Throws helpful error
    }
  }
}
```

## Node.js Microservices (Full Implementation)

**Environment:** Node.js 18+, microservices, Fastify apps

**Import Style:**
```typescript
import { telemetry, eventbus, server, logger } from '@nauticalstream/sdk';
// OR
import { createLogger } from '@nauticalstream/sdk/telemetry';
import { EventBus } from '@nauticalstream/sdk/eventbus';
import { createFastifyServer } from '@nauticalstream/sdk/server/fastify';
```

**What You Get:**
- ✅ **telemetry** - Full OpenTelemetry + Sentry integration
- ✅ **eventbus** - NATS (Core NATS + JetStream)
- ✅ **server/fastify** - Fastify server utilities, plugins, GraphQL
- ✅ **logger** - Pino logger with trace/correlation IDs
- ✅ **realtime** - MQTT client (pub/sub)
- ✅ **errors** - Error handling and formatting
- ✅ **crypto** - Encryption utilities
- ✅ **permissions** - Ory Keto integration
- ✅ **resilience** - Circuit breaker, retry, bulkhead
- ✅ **workspace** - Workspace utilities

**Dependencies:** All native modules (Sentry, NATS, OpenTelemetry) work normally.

## Browser Applications (Browser-Safe Implementation)

**Environment:** SvelteKit, React, Vue, Angular, Vite, Webpack

**Import Style:**
```typescript
// Main entry point - SAFE in browser
import { realtime, errors, logger } from '@nauticalstream/sdk';

// OR subpath imports
import { createConsoleLogger } from '@nauticalstream/sdk/logger';
import { RealtimeClient } from '@nauticalstream/sdk/realtime';
import { formatHttpError } from '@nauticalstream/sdk/errors';
```

**What You Get:**

### ✅ Browser-Safe Modules (Full Implementation)
- **logger** - Console-based logger (createConsoleLogger)
- **realtime** - MQTT client for browser pub/sub
- **errors** - Error formatting and conversion
- **crypto** - Browser-safe crypto utilities
- **permissions** - Keto client (HTTP-based, no native deps)
- **resilience** - Circuit breaker, retry (pure JS)
- **workspace** - Workspace utilities

### ⚠️ Server-Only Modules (Browser Stubs)
If you try to import these in the browser, you get **helpful error messages**:

```typescript
// ❌ This will throw in browser:
import { initTelemetry } from '@nauticalstream/sdk/telemetry';
initTelemetry(); // Error: "initTelemetry is only available in Node.js..."

// ❌ This will throw in browser:
import { EventBus } from '@nauticalstream/sdk/eventbus';
// Error: "EventBus is only available in Node.js. For client-side pub/sub, use @nauticalstream/sdk/realtime"

// ❌ This will throw in browser:
import { createFastifyServer } from '@nauticalstream/sdk/server/fastify';
// Error: "createFastifyServer is only available in Node.js..."
```

**Why Browser Stubs?**
- Native Node.js modules (Sentry C++ bindings, NATS) cannot run in browsers
- Stubs provide clear error messages instead of cryptic bundler/runtime errors
- TypeScript still gives you autocomplete (stubs have full type definitions)

## SvelteKit Specific

### ✅ Client-Side Code (.svelte files, +page.ts)
```typescript
// src/routes/+page.svelte
<script lang="ts">
  import { RealtimeClient } from '@nauticalstream/sdk/realtime';
  import { createConsoleLogger } from '@nauticalstream/sdk/logger';
  
  const logger = createConsoleLogger({ service: 'web-app' });
  const client = new RealtimeClient({ url: 'mqtt://broker', logger });
</script>
```

### ✅ Server-Side Code (+page.server.ts, +server.ts)
```typescript
// src/routes/api/+server.ts
import { createLogger } from '@nauticalstream/sdk/telemetry';
import { EventBus } from '@nauticalstream/sdk/eventbus';

const logger = createLogger({ name: 'api-handler' });
const eventbus = new EventBus({ servers: ['nats://localhost:4222'] });
```

**SvelteKit automatically routes:**
- `.server.ts` files → Node.js (gets full SDK)
- `.svelte` files → Browser (gets browser-safe SDK)

## Migration Guide (For Existing Services)

**Good News: Zero Breaking Changes!**

All 30+ microservices can upgrade immediately without code changes:
```bash
# In any microservice
npm install @nauticalstream/sdk@latest
```

No code changes needed. Everything works exactly as before.

## Best Practices

### ✅ DO: Use Subpath Imports
```typescript
// Specific imports = better tree-shaking
import { createLogger } from '@nauticalstream/sdk/telemetry';
import { RealtimeClient } from '@nauticalstream/sdk/realtime';
```

### ✅ DO: Import Browser-Safe Modules in Frontend
```typescript
// web-public/src/lib/logger.ts
import { createConsoleLogger } from '@nauticalstream/sdk/logger';
export const logger = createConsoleLogger({ service: 'web-public' });
```

### ⚠️ DON'T: Import Server Modules in Browser
```typescript
// ❌ This will fail in browser:
import { createLogger } from '@nauticalstream/sdk/telemetry';

// ✅ Use this instead:
import { createConsoleLogger } from '@nauticalstream/sdk/logger';
```

### ✅ DO: Check Environment for Conditional Features
```typescript
// If you need to conditionally use telemetry:
let logger;
if (typeof window === 'undefined') {
  // Node.js
  const { createLogger } = await import('@nauticalstream/sdk/telemetry');
  logger = createLogger({ name: 'ssr' });
} else {
  // Browser
  const { createConsoleLogger } = await import('@nauticalstream/sdk/logger');
  logger = createConsoleLogger({ service: 'client' });
}
```

## Testing

### Test in Node.js (microservice)
```bash
cd services/chat-service
npm install @nauticalstream/sdk@latest
npm run dev  # Should work unchanged
```

### Test in Browser (SvelteKit)
```bash
cd interfaces/web-public
npm install @nauticalstream/sdk@latest
npm run dev  # Should have NO CpuProfilerBindings errors
```

Open browser console - should see no Sentry native module errors.

## Summary

| Module | Node.js | Browser | Notes |
|--------|---------|---------|-------|
| **logger** | ✅ Pino | ✅ Console | Universal logger interface |
| **telemetry** | ✅ Full | ⚠️ Stub | OpenTelemetry + Sentry (Node.js only) |
| **eventbus** | ✅ Full | ⚠️ Stub | NATS (use realtime in browser) |
| **server/fastify** | ✅ Full | ⚠️ Stub | Fastify server (Node.js only) |
| **realtime** | ✅ Full | ✅ Full | MQTT client (works everywhere) |
| **errors** | ✅ Full | ✅ Full | Error handling (works everywhere) |
| **crypto** | ✅ Full | ✅ Full | Encryption (works everywhere) |
| **permissions** | ✅ Full | ✅ Full | Keto client (HTTP-based) |
| **resilience** | ✅ Full | ✅ Full | Circuit breaker (works everywhere) |
| **workspace** | ✅ Full | ✅ Full | Workspace utils (works everywhere) |

**Legend:**
- ✅ **Full** - Complete implementation
- ⚠️ **Stub** - Throws helpful error message

## Architecture

```
@nauticalstream/sdk
├── logger/          (foundation, zero deps)
│   ├── types.ts     (Logger interface)
│   ├── pino.ts      (Node.js implementation)
│   └── console.ts   (browser implementation)
├── telemetry/       (builds on logger)
│   ├── index.ts     (Node.js: full OpenTelemetry)
│   └── browser-stub.ts (Browser: helpful errors)
├── eventbus/
│   ├── index.ts     (Node.js: NATS)
│   └── browser-stub.ts (Browser: helpful errors)
└── realtime/        (browser-safe, uses logger)
    └── index.ts     (MQTT client, works everywhere)
```

**Dependency Chain:**
```
logger (foundation) → telemetry → services
logger (foundation) → realtime (browser-safe)
logger (foundation) → errors (browser-safe)
```

No circular dependencies. Clean separation.
