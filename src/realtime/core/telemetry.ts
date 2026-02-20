import {
  context,
  propagation,
  trace,
  SpanKind,
  SpanStatusCode,
  type TextMapGetter,
  type TextMapSetter,
} from '@opentelemetry/api';

const TRACER_NAME = '@nauticalstream/realtime';

/**
 * TextMap carrier adapters for MQTT User Properties
 * MQTT v5 userProperties is Record<string, string | string[]>
 * OTel propagation injects/extracts trace context via string key/value pairs.
 */
const setter: TextMapSetter<Record<string, string>> = {
  set(carrier, key, value) {
    carrier[key] = value;
  },
};

const getter: TextMapGetter<Record<string, string | string[]> | undefined> = {
  get(carrier, key) {
    if (!carrier) return undefined;
    const value = carrier[key];
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0];
    return undefined;
  },
  keys(carrier) {
    return carrier ? Object.keys(carrier) : [];
  },
};

/**
 * Create MQTT User Properties with trace context and correlation metadata
 * Returns Record<string, string> for MQTT v5 userProperties
 * 
 * If no OTel SDK is registered, trace context injection is a silent no-op.
 * Correlation ID and timestamp are always added for log correlation.
 * 
 * @param correlationId - Unique ID for message tracing across services
 * @param source - Optional service name that published the message
 */
export function createPublishProperties(
  correlationId: string,
  source?: string
): Record<string, string> {
  const properties: Record<string, string> = {
    'x-correlation-id': correlationId,
    'x-timestamp': new Date().toISOString(),
  };
  
  if (source) {
    properties['x-source'] = source;
  }
  
  // Inject OTel trace context (silent no-op if no SDK registered)
  propagation.inject(context.active(), properties, setter);
  
  return properties;
}

/**
 * Wrap a publish operation in an OTel producer span
 * Records topic, message size, and any errors
 * 
 * If no OTel SDK is registered, this is a silent no-op wrapper.
 * 
 * @param topic - MQTT topic being published to
 * @param messageSize - Size of the message payload in bytes
 * @param fn - Async function to execute within the span
 */
export async function withPublishSpan(
  topic: string,
  messageSize: number,
  fn: () => Promise<void>
): Promise<void> {
  const tracer = trace.getTracer(TRACER_NAME);
  const span = tracer.startSpan(`publish ${topic}`, {
    kind: SpanKind.PRODUCER,
    attributes: {
      'messaging.system': 'mqtt',
      'messaging.destination': topic,
      'messaging.message.payload_size_bytes': messageSize,
    },
  });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      await fn();
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (err instanceof Error) span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Wrap a message handler in an OTel consumer span
 * Extracts trace context from MQTT userProperties and creates a child span
 * 
 * If no OTel SDK is registered, this is a silent no-op wrapper.
 * 
 * @param topic - MQTT topic the message was received on
 * @param userProperties - MQTT v5 userProperties containing trace context
 * @param fn - Async function to execute within the span
 */
export async function withMessageSpan(
  topic: string,
  userProperties: Record<string, string | string[]> | undefined,
  fn: () => Promise<void>
): Promise<void> {
  const parentCtx = propagation.extract(context.active(), userProperties, getter);
  const tracer = trace.getTracer(TRACER_NAME);

  const span = tracer.startSpan(
    `receive ${topic}`,
    {
      kind: SpanKind.CONSUMER,
      attributes: {
        'messaging.system': 'mqtt',
        'messaging.destination': topic,
      },
    },
    parentCtx
  );

  return context.with(trace.setSpan(parentCtx, span), async () => {
    try {
      await fn();
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (err instanceof Error) span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
