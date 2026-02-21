// Base exception classes
export { DomainException, SystemException } from '../../../errors';

// Domain exceptions (client errors - non-retryable)
export {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  OperationError,
} from '../../../errors';

// System exceptions (infrastructure errors - retryable)
export {
  DatabaseError,
  ServiceUnavailableError,
  NetworkError,
  TimeoutError,
} from '../../../errors';

// Error codes and types
export { ErrorCode, ErrorSeverity, ResourceType } from '../../../errors';
