import { create } from '@bufbuild/protobuf';
import { ErrorSchema } from '@nauticalstream/proto/error/v1/error_pb';
import { ResourceType } from '@nauticalstream/proto/error/v1/codes_pb';
import { getCorrelationId } from '../../telemetry';
/**
 * Convert DomainException or SystemException to Proto Error message
 *
 * Used for publishing errors to NATS/MQTT so frontend can:
 * - Remove failed optimistic UI updates
 * - Display user-friendly error messages
 * - Track errors for analytics
 * - Implement retry strategies
 *
 * @example
 * ```typescript
 * try {
 *   await createMessage(input);
 * } catch (error) {
 *   if (error instanceof DomainException) {
 *     const protoError = toProtoError(error, {
 *       optimisticId: input.optimisticId,
 *       resourceType: ResourceType.MESSAGE,
 *       resourceId: input.conversationId,
 *     });
 *
 *     // Publish to frontend via MQTT
 *     await mqtt.publish(`user/${userId}/errors`, protoError);
 *   }
 *   throw error;
 * }
 * ```
 */
export function toProtoError(error, options = {}) {
    return create(ErrorSchema, {
        correlationId: getCorrelationId(),
        optimisticId: options.optimisticId ?? '',
        code: error.errorCode,
        severity: error.severity,
        message: error.message,
        resourceType: options.resourceType ?? ResourceType.UNSPECIFIED,
        resourceId: options.resourceId ?? '',
        timestamp: {
            seconds: BigInt(Math.floor(Date.now() / 1000)),
            nanos: (Date.now() % 1000) * 1_000_000,
        },
        retryAfterSeconds: options.retryAfterSeconds,
    });
}
//# sourceMappingURL=toProtoError.js.map