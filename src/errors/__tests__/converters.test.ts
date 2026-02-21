import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { ErrorSchema } from '@nauticalstream/proto/error/v1/error_pb';
import { ErrorCode, ErrorSeverity, ResourceType } from '@nauticalstream/proto/error/v1/codes_pb';
import type { Error as ProtoError } from '@nauticalstream/proto/error/v1/error_pb';

import { toProtoError } from '../converters/toProtoError';
import { fromProtoError } from '../converters/fromProtoError';

import { ValidationError } from '../domain/ValidationError';
import { NotFoundError } from '../domain/NotFoundError';
import { UnauthorizedError } from '../domain/UnauthorizedError';
import { ForbiddenError } from '../domain/ForbiddenError';
import { ConflictError } from '../domain/ConflictError';
import { OperationError } from '../domain/OperationError';
import { ServiceUnavailableError } from '../system/ServiceUnavailableError';
import { DatabaseError } from '../system/DatabaseError';
import { TimeoutError } from '../system/TimeoutError';

// Mock telemetry so toProtoError doesn't require a live OTel context
vi.mock('../../telemetry', () => ({
  getCorrelationId: vi.fn().mockReturnValue('test-correlation-id'),
}));

// Helper to build a minimal ProtoError for fromProtoError tests
function makeProto(
  code: ErrorCode,
  severity: ErrorSeverity = ErrorSeverity.CLIENT_ERROR,
  message = 'test message',
  resourceType: ResourceType = ResourceType.UNSPECIFIED,
  resourceId = ''
): ProtoError {
  return create(ErrorSchema, {
    code,
    severity,
    message,
    resourceType,
    resourceId,
  }) as ProtoError;
}

// ─── toProtoError ────────────────────────────────────────────────────────────

describe('toProtoError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps DomainException fields to proto', () => {
    const err = new ValidationError('name is required');
    const proto = toProtoError(err);

    expect(proto.code).toBe(err.errorCode);
    expect(proto.severity).toBe(err.severity);
    expect(proto.message).toBe(err.message);
  });

  it('maps SystemException fields to proto', () => {
    const err = new ServiceUnavailableError('down');
    const proto = toProtoError(err);

    expect(proto.code).toBe(err.errorCode);
    expect(proto.severity).toBe(err.severity);
    expect(proto.message).toBe('down');
  });

  it('uses correlationId from getCorrelationId()', async () => {
    const { getCorrelationId } = await import('../../telemetry');
    const err = new ValidationError('bad');
    toProtoError(err);
    expect(getCorrelationId).toHaveBeenCalledOnce();
  });

  it('sets correlationId on proto message', () => {
    const err = new ValidationError('bad');
    const proto = toProtoError(err);
    expect(proto.correlationId).toBe('test-correlation-id');
  });

  it('defaults: optimisticId empty, resourceType UNSPECIFIED, resourceId empty', () => {
    const proto = toProtoError(new ValidationError('x'));
    expect(proto.optimisticId).toBe('');
    expect(proto.resourceType).toBe(ResourceType.UNSPECIFIED);
    expect(proto.resourceId).toBe('');
  });

  it('sets optimisticId from options', () => {
    const proto = toProtoError(new ValidationError('x'), { optimisticId: 'opt-1' });
    expect(proto.optimisticId).toBe('opt-1');
  });

  it('sets resourceType and resourceId from options', () => {
    const proto = toProtoError(new NotFoundError('User', 'u1'), {
      resourceType: ResourceType.MESSAGE,
      resourceId: 'msg-42',
    });
    expect(proto.resourceType).toBe(ResourceType.MESSAGE);
    expect(proto.resourceId).toBe('msg-42');
  });

  it('sets retryAfterSeconds from options', () => {
    const proto = toProtoError(new ServiceUnavailableError('rate limited'), {
      retryAfterSeconds: 30,
    });
    expect(proto.retryAfterSeconds).toBe(30);
  });

  it('sets a non-zero timestamp (seconds)', () => {
    const proto = toProtoError(new ValidationError('ts test'));
    expect(proto.timestamp).toBeDefined();
    expect(Number(proto.timestamp!.seconds)).toBeGreaterThan(0);
  });
});

// ─── fromProtoError ──────────────────────────────────────────────────────────

describe('fromProtoError', () => {
  describe('domain errors', () => {
    it('NOT_FOUND → NotFoundError', () => {
      const result = fromProtoError(makeProto(ErrorCode.NOT_FOUND));
      expect(result).toBeInstanceOf(NotFoundError);
    });

    it('UNAUTHORIZED → UnauthorizedError', () => {
      expect(fromProtoError(makeProto(ErrorCode.UNAUTHORIZED))).toBeInstanceOf(UnauthorizedError);
    });

    it('PERMISSION_DENIED → ForbiddenError', () => {
      expect(fromProtoError(makeProto(ErrorCode.PERMISSION_DENIED))).toBeInstanceOf(ForbiddenError);
    });

    it('NOT_PARTICIPANT → ForbiddenError', () => {
      expect(fromProtoError(makeProto(ErrorCode.NOT_PARTICIPANT))).toBeInstanceOf(ForbiddenError);
    });

    it('INSUFFICIENT_PERMISSIONS → ForbiddenError', () => {
      expect(fromProtoError(makeProto(ErrorCode.INSUFFICIENT_PERMISSIONS))).toBeInstanceOf(ForbiddenError);
    });

    it('VALIDATION_ERROR → ValidationError', () => {
      expect(fromProtoError(makeProto(ErrorCode.VALIDATION_ERROR))).toBeInstanceOf(ValidationError);
    });

    it('INVALID_FIELD → ValidationError', () => {
      expect(fromProtoError(makeProto(ErrorCode.INVALID_FIELD))).toBeInstanceOf(ValidationError);
    });

    it('MISSING_FIELD → ValidationError', () => {
      expect(fromProtoError(makeProto(ErrorCode.MISSING_FIELD))).toBeInstanceOf(ValidationError);
    });

    it('CONSTRAINT_VIOLATION → ValidationError', () => {
      expect(fromProtoError(makeProto(ErrorCode.CONSTRAINT_VIOLATION))).toBeInstanceOf(ValidationError);
    });

    it('CONFLICT → ConflictError', () => {
      expect(fromProtoError(makeProto(ErrorCode.CONFLICT))).toBeInstanceOf(ConflictError);
    });

    it('ALREADY_EXISTS → ConflictError', () => {
      expect(fromProtoError(makeProto(ErrorCode.ALREADY_EXISTS))).toBeInstanceOf(ConflictError);
    });

    it('RESOURCE_DELETED → ConflictError', () => {
      expect(fromProtoError(makeProto(ErrorCode.RESOURCE_DELETED))).toBeInstanceOf(ConflictError);
    });

    it('preserves message text', () => {
      const result = fromProtoError(makeProto(ErrorCode.UNAUTHORIZED, ErrorSeverity.CLIENT_ERROR, 'token expired'));
      expect(result.message).toBe('token expired');
    });
  });

  describe('system errors', () => {
    it('SERVICE_UNAVAILABLE → ServiceUnavailableError', () => {
      expect(fromProtoError(makeProto(ErrorCode.SERVICE_UNAVAILABLE, ErrorSeverity.RETRYABLE))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('DEADLINE_EXCEEDED → TimeoutError', () => {
      expect(fromProtoError(makeProto(ErrorCode.DEADLINE_EXCEEDED, ErrorSeverity.RETRYABLE))).toBeInstanceOf(TimeoutError);
    });

    it('INTERNAL_ERROR + RETRYABLE severity → DatabaseError', () => {
      expect(fromProtoError(makeProto(ErrorCode.INTERNAL_ERROR, ErrorSeverity.RETRYABLE))).toBeInstanceOf(DatabaseError);
    });

    it('INTERNAL_ERROR + FATAL severity → OperationError', () => {
      expect(fromProtoError(makeProto(ErrorCode.INTERNAL_ERROR, ErrorSeverity.FATAL))).toBeInstanceOf(OperationError);
    });

    it('DEPENDENCY_FAILED + RETRYABLE → DatabaseError', () => {
      expect(fromProtoError(makeProto(ErrorCode.DEPENDENCY_FAILED, ErrorSeverity.RETRYABLE))).toBeInstanceOf(DatabaseError);
    });

    it('DEPENDENCY_FAILED + FATAL → OperationError', () => {
      expect(fromProtoError(makeProto(ErrorCode.DEPENDENCY_FAILED, ErrorSeverity.FATAL))).toBeInstanceOf(OperationError);
    });
  });

  describe('unmapped error codes → plain Error', () => {
    it('RATE_LIMIT_EXCEEDED → Error', () => {
      expect(fromProtoError(makeProto(ErrorCode.RATE_LIMIT_EXCEEDED))).toBeInstanceOf(Error);
    });

    it('QUOTA_EXCEEDED → Error', () => {
      expect(fromProtoError(makeProto(ErrorCode.QUOTA_EXCEEDED))).toBeInstanceOf(Error);
    });

    it('THROTTLED → Error', () => {
      expect(fromProtoError(makeProto(ErrorCode.THROTTLED))).toBeInstanceOf(Error);
    });

    it('UNSPECIFIED → Error with "Unknown error" fallback', () => {
      const result = fromProtoError(makeProto(ErrorCode.UNSPECIFIED, ErrorSeverity.CLIENT_ERROR, ''));
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown error');
    });

    it('UNSPECIFIED with message preserves message', () => {
      const result = fromProtoError(makeProto(ErrorCode.UNSPECIFIED, ErrorSeverity.CLIENT_ERROR, 'some msg'));
      expect(result.message).toBe('some msg');
    });
  });

  describe('round-trip: toProtoError → fromProtoError', () => {
    it('ValidationError survives a round-trip', () => {
      const original = new ValidationError('email invalid');
      const proto = toProtoError(original);
      const recovered = fromProtoError(proto);
      expect(recovered).toBeInstanceOf(ValidationError);
      expect(recovered.message).toBe(original.message);
    });

    it('ServiceUnavailableError survives a round-trip', () => {
      const original = new ServiceUnavailableError('db down');
      const proto = toProtoError(original);
      const recovered = fromProtoError(proto);
      expect(recovered).toBeInstanceOf(ServiceUnavailableError);
      expect(recovered.message).toBe(original.message);
    });

    it('DatabaseError survives a round-trip', () => {
      const original = new DatabaseError('query timeout');
      const proto = toProtoError(original);
      const recovered = fromProtoError(proto);
      expect(recovered).toBeInstanceOf(DatabaseError);
    });
  });
});
