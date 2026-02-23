# Realtime

MQTT-based pub/sub client. Messages are serialized as JSON — use proto-generated types for full type safety without binary encoding. OTel trace propagation, circuit-breaker, and retry built-in.

---

## Setup

```typescript
import { RealtimeClient } from '@nauticalstream/sdk/realtime';

const client = new RealtimeClient({
  brokerUrl: process.env.MQTT_URL ?? 'mqtt://localhost:1883',
  name:      'workspace-service',
  clientId:  'workspace-service-1',
});

await client.connect();

process.on('SIGTERM', () => client.disconnect());
```

---

## Publish

```typescript
import { TOPICS } from '@nauticalstream/sdk/realtime';
import type { ChatMessage } from '@nauticalstream/proto/chat/v1/chat_pb';

// Proto type for type safety, plain JSON over the wire
await client.publish<ChatMessage>(
  TOPICS.CHAT.conversation(conversationId),
  { content: 'Hello', authorId: userId },
);

// Untyped
await client.publish(TOPICS.PRESENCE.user(userId), { userId, status: 'online' });
```

---

## Subscribe & Receive

```typescript
import type { ChatMessage } from '@nauticalstream/proto/chat/v1/chat_pb';

await client.subscribe(TOPICS.CHAT.conversation(conversationId));

client.onMessage<ChatMessage>((topic, message) => {
  console.log(message.content); // fully typed, auto-parsed from JSON
});
```

---

## Topics

```typescript
import { TOPICS } from '@nauticalstream/sdk/realtime';

// Chat
TOPICS.CHAT.user(userId)                   // 'user/{userId}'
TOPICS.CHAT.conversation(conversationId)   // 'conv/{conversationId}'
TOPICS.CHAT.commands.sendMessage()         // 'commands/chat/send'
TOPICS.CHAT.commands.typing()              // 'commands/chat/typing'

// Presence
TOPICS.PRESENCE.user(userId)               // 'presence/{userId}'
TOPICS.PRESENCE.workspace(workspaceId)     // 'presence/workspace/{workspaceId}'

// Notifications
TOPICS.NOTIFICATION.user(userId)           // 'notification/{userId}'
TOPICS.NOTIFICATION.workspace(workspaceId) // 'notification/workspace/{workspaceId}'

// Workspace
TOPICS.WORKSPACE.updates(workspaceId)      // 'workspace/{workspaceId}/updates'
TOPICS.WORKSPACE.members(workspaceId)      // 'workspace/{workspaceId}/members'
```

---

## OTel trace propagation

Trace context is propagated **automatically** — every `publish` creates a PRODUCER span and injects W3C trace context into MQTT v5 user properties; every `onMessage` creates a CONSUMER span and restores the trace link from those properties. No manual wiring needed.

```typescript
// Both sides just add domain-specific attributes to the span
client.onMessage<ChatMessage>((topic, message) => {
  // traceId, spanId, correlationId already active in context
  logger.info({ conversationId: message.conversationId }, 'message received');
  await processMessage(message);
});
```

---

## QoS & retain

```typescript
await client.publish(TOPICS.WORKSPACE.updates(workspaceId), payload, {
  qos:    1,      // 0 = at-most-once, 1 = at-least-once (default), 2 = exactly-once
  retain: false,  // broker keeps last message for new subscribers when true
});
```

