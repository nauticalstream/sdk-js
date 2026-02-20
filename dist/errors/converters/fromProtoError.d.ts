import { Error as ProtoError } from '@nauticalstream/proto/error/v1/error_pb';
import type { DomainException } from '../base/DomainException';
import type { SystemException } from '../base/SystemException';
/**
 * Convert Proto Error message back to DomainException or SystemException
 *
 * Useful when consuming errors from other services via NATS/MQTT.
 * Allows error handling logic to work consistently whether error originated
 * locally or from another service.
 *
 * Note: Some context may be lost in conversion (e.g., stack traces, custom properties)
 *
 * @example
 * ```typescript
 * eventbus.subscribe({
 *   subject: 'error.*',
 *   handler: async (protoError: ProtoError) => {
 *     const exception = fromProtoError(protoError);
 *
 *     if (exception instanceof NotFoundError) {
 *       // Handle not found error
 *     } else if (exception.isRetryable) {
 *       // Retry the operation
 *     }
 *   },
 * });
 * ```
 */
export declare function fromProtoError(protoError: ProtoError): DomainException | SystemException | Error;
//# sourceMappingURL=fromProtoError.d.ts.map