"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProtoError = toProtoError;
const protobuf_1 = require("@bufbuild/protobuf");
const error_pb_1 = require("@nauticalstream/proto/error/v1/error_pb");
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const telemetry_1 = require("../../telemetry");
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
function toProtoError(error, options = {}) {
    return (0, protobuf_1.create)(error_pb_1.ErrorSchema, {
        correlationId: (0, telemetry_1.getCorrelationId)(),
        optimisticId: options.optimisticId ?? '',
        code: error.errorCode,
        severity: error.severity,
        message: error.message,
        resourceType: options.resourceType ?? codes_pb_1.ResourceType.UNSPECIFIED,
        resourceId: options.resourceId ?? '',
        timestamp: {
            seconds: BigInt(Math.floor(Date.now() / 1000)),
            nanos: (Date.now() % 1000) * 1000000,
        },
        retryAfterSeconds: options.retryAfterSeconds,
    });
}
//# sourceMappingURL=toProtoError.js.map