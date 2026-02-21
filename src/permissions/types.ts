import { 
  PlatformRole, 
  WorkspaceRole, 
  ResourcePermission 
} from '@nauticalstream/proto/permissions/v1/permissions_pb';
import type { Logger } from 'pino';
import type { RetryConfig, CircuitBreakerConfig } from './core/config';

export { PlatformRole, WorkspaceRole, ResourcePermission };

export interface PermissionsConfig {
  readUrl: string;
  writeUrl: string;
  /** Optional Pino logger (uses default if not provided) */
  logger?: Logger;
  /** Retry configuration (uses defaults if not provided) */
  retryConfig?: RetryConfig;
  /** Circuit breaker configuration (enabled by default) */
  circuitBreaker?: CircuitBreakerConfig;
}

export interface CheckPermissionParams {
  namespace: string;
  object: string;
  relation: string;
  subjectId: string;
}

export interface CreateRelationshipParams {
  namespace: string;
  object: string;
  relation: string;
  subjectId?: string;
  subjectSet?: {
    namespace: string;
    object: string;
    relation: string;
  };
}

export interface DeleteRelationshipParams {
  namespace: string;
  object: string;
  relation: string;
  subjectId?: string;
  subjectSet?: {
    namespace: string;
    object: string;
    relation: string;
  };
}

export interface ListRelationshipsParams {
  namespace: string;
  object?: string;
  relation?: string;
  subjectId?: string;
}
