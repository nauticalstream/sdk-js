import type { Logger } from '../logger/index.js';
import type { RetryConfig, CircuitBreakerConfig } from './core/config.js';

export type PermissionsSecurity = 'secure' | 'insecure-localhost' | 'insecure-plaintext';

export interface PermissionsConfig {
  /** Preferred permissions endpoint, e.g. permissions:50051 */
  endpoint?: string;
  /** Optional permissions service token */
  token?: string;
  /** Explicit transport security mode */
  security?: PermissionsSecurity;
  /** Shortcut for insecure plaintext transport inside trusted networks */
  insecure?: boolean;
  /** Legacy alias retained for transition compatibility. If provided, it is treated as the permissions endpoint. */
  readUrl?: string;
  /** Legacy alias retained for transition compatibility. If provided, it is treated as the permissions endpoint. */
  writeUrl?: string;
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
  namespace?: string;
  object?: string;
  relation?: string;
  subjectId?: string;
}
