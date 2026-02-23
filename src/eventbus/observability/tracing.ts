/**
 * EventBus observability — thin wrappers over the SDK's unified tracing helpers.
 *
 * `createPublishHeaders` → injectTraceHeaders  (SpanKind.PRODUCER context injection)
 * `withSubscribeSpan`    → withConsumerSpan    (SpanKind.CONSUMER context extraction)
 *
 * Importing from `telemetry/utils/tracing` ensures both the EventBus and
 * application code use consistent SpanKind, attribute conventions, and error
 * handling rather than maintaining two diverging span helpers.
 */

export {
  injectTraceHeaders as createPublishHeaders,
  withConsumerSpan as withSubscribeSpan,
} from '../../telemetry/utils/tracing';
