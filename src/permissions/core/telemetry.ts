import {
  context,
  trace,
  SpanKind,
  SpanStatusCode,
} from '@opentelemetry/api';

const TRACER_NAME = '@nauticalstream/permissions';

/**
 * Wrap a permission operation in an OpenTelemetry span
 * Records operation details and error status
 * 
 * @param operation - Operation name (e.g., 'check.platform.admin', 'grant.workspace.owner')
 * @param attributes - Span attributes (userId, workspaceId, permission, etc.)
 * @param fn - Function to execute within the span
 */
export async function withPermissionSpan<T>(
  operation: string,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);

  const span = tracer.startSpan(
    `permission.${operation}`,
    {
      kind: SpanKind.INTERNAL,
      attributes,
    }
  );

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      
      // Add result attributes if applicable
      if (typeof result === 'boolean') {
        span.setAttribute('permission.allowed', result);
      }
      
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (err instanceof Error) {
        span.recordException(err);
      } else {
        span.recordException(new Error(String(err)));
      }
      throw err;
    } finally {
      span.end();
    }
  });
}
