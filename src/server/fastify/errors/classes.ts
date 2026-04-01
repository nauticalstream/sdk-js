// Base exception classes
export { DomainException, SystemException } from '../../../errors/index.js';

// Domain exceptions (client errors - non-retryable)
export {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  OperationError,
} from '../../../errors/index.js';

// System exceptions (infrastructure errors - retryable)
export {
  DatabaseError,
  ServiceUnavailableError,
  NetworkError,
  TimeoutError,
} from '../../../errors/index.js';

// Error codes and types
export { ErrorCode, ErrorSeverity, ResourceType } from '../../../errors/index.js';
