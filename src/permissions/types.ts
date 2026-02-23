import { PlatformRole, WorkspaceRole } from '@nauticalstream/proto/permissions/v1/roles_pb';
import { PermissionNamespace } from '@nauticalstream/proto/permissions/v1/namespaces_pb';
import { PostPermission } from '@nauticalstream/proto/permissions/v1/post_permissions_pb';
import { FilePermission } from '@nauticalstream/proto/permissions/v1/file_permissions_pb';
import { ArticlePermission } from '@nauticalstream/proto/permissions/v1/article_permissions_pb';
import { WorkspacePermission } from '@nauticalstream/proto/permissions/v1/workspace_permissions_pb';
import type { Logger } from 'pino';
import type { RetryConfig, CircuitBreakerConfig } from './core/config';

export {
  PlatformRole,
  WorkspaceRole,
  PermissionNamespace,
  PostPermission,
  FilePermission,
  ArticlePermission,
  WorkspacePermission,
};

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
