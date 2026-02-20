# @nauticalstream/sdk

Official JavaScript/TypeScript SDK for Nauticalstream microservices platform.

## 📦 Installation

```bash
npm install @nauticalstream/sdk
```

## 🚀 Features

- **Telemetry**: OpenTelemetry integration with tracing, metrics, and Sentry error tracking
- **Errors**: Standardized error handling with protobuf-based error types
- **EventBus**: NATS-based event messaging with JetStream support and circuit breakers
- **Crypto**: Cryptographic utilities and secure ID generation
- **Realtime**: MQTT client for real-time messaging with automatic reconnection

## 📖 Usage

### Telemetry

```typescript
import {
  initializeTelemetry,
  createTracer,
} from "@nauticalstream/sdk/telemetry";

// Initialize OpenTelemetry
initializeTelemetry({
  serviceName: "my-service",
  otlpEndpoint: "http://localhost:4317",
  sentryDsn: process.env.SENTRY_DSN,
});

// Create a tracer
const tracer = createTracer("my-module");
const span = tracer.startSpan("operation");
// ... do work
span.end();
```

### Errors

```typescript
import {
  NauticalError,
  ErrorCode,
  ErrorSeverity,
} from "@nauticalstream/sdk/errors";

throw new NauticalError({
  code: ErrorCode.INVALID_ARGUMENT,
  message: "User ID is required",
  severity: ErrorSeverity.ERROR,
  details: { field: "userId" },
});
```

### EventBus (NATS)

```typescript
import {
  createNatsClient,
  subscribe,
  publish,
} from "@nauticalstream/sdk/eventbus";

const client = await createNatsClient({ servers: ["nats://localhost:4222"] });

// Subscribe to events
await subscribe(client, logger, {
  stream: "ORDERS",
  consumer: "order-processor",
  subject: "orders.created",
  handler: async (data, msg) => {
    const event = fromBinary(OrderCreatedSchema, data);
    console.log("Order created:", event);
    msg.ack();
  },
});

// Publish events
await publish(client, "orders.created", eventData);
```

### Realtime (MQTT)

```typescript
import { MqttClient } from "@nauticalstream/sdk/realtime";

const client = new MqttClient({
  brokerUrl: "mqtt://localhost:1883",
  clientId: "my-client",
});

await client.connect();
client.subscribe("devices/+/status", (topic, message) => {
  console.log(`${topic}: ${message.toString()}`);
});
```

### Crypto

```typescript
import { generateId, hashPassword } from "@nauticalstream/sdk/crypto";

const userId = generateId(); // Secure nanoid
const hash = await hashPassword("my-password");
```

## 🔧 Requirements

- Node.js 18+ (recommended: Node.js 24)
- TypeScript 5.9+
- Fastify 5+ (peer dependency for telemetry plugin)

## 📝 License

ISC

## 🔗 Related Packages

- [@nauticalstream/proto](https://www.npmjs.com/package/@nauticalstream/proto) - Protocol Buffer definitions
