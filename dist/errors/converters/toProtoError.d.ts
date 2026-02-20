import { Error as ProtoError } from '@nauticalstream/proto/error/v1/error_pb';
import { ResourceType } from '@nauticalstream/proto/error/v1/codes_pb';
import type { DomainException } from '../base/DomainException';
import type { SystemException } from '../base/SystemException';
/**
 * Options for converting exception to Proto Error
 */
export interface ToProtoErrorOptions {
    /**
     * Optimistic UI message ID (for frontend to remove failed optimistic updates)
     * Only set for message/operation-specific errors
     */
    optimisticId?: string;
    /**
     * Type of resource that failed (message, conversation, participant, etc.)
     */
    resourceType?: ResourceType;
    /**
     * ID of the resource that failed (conversationId, messageId, etc.)
     */
    resourceId?: string;
    /**
     * Retry hint for rate limiting (in seconds)
     * Only set when error code is RATE_LIMIT_EXCEEDED
     */
    retryAfterSeconds?: number;
}
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
export declare function toProtoError(error: DomainException | SystemException, options?: ToProtoErrorOptions): ProtoError;
//# sourceMappingURL=toProtoError.d.ts.map