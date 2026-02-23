/**
 * @nauticalstream/sdk - Permissions Module
 * 
 * Comprehensive permission management using Ory Keto.
 * 
 * @example
 * ```typescript
 * import { Permissions } from '@nauticalstream/sdk/permissions';
 * 
 * const permissions = new Permissions({ readUrl: '...', writeUrl: '...' });
 * 
 * // Platform permissions
 * const isAdmin = await permissions.platform.hasAdmin(userId);
 * await permissions.platform.grantRole(userId, PlatformRole.ADMIN);
 * 
 * // Workspace permissions
 * await permissions.workspace.requireRole(workspaceId, userId, WorkspaceRole.ADMIN);
 * 
 * // Post permissions
 * await permissions.posts.requirePermission(postId, userId, PostPermission.EDIT);
 * await permissions.posts.linkToWorkspace(postId, workspaceId);
 * 
 * // Article permissions
 * await permissions.articles.requirePermission(articleId, userId, ArticlePermission.VIEW);
 * 
 * // File permissions
 * await permissions.files.requirePermission(fileId, userId, FilePermission.DELETE);
 * ```
 */

// Main API
export { Permissions } from './core/permissions';

// Types
export type {
  PermissionsConfig,
  CheckPermissionParams,
  CreateRelationshipParams,
  DeleteRelationshipParams,
  ListRelationshipsParams,
} from './types';

export {
  PlatformRole,
  WorkspaceRole,
  WorkspacePermission,
  PermissionNamespace,
  PostPermission,
  FilePermission,
  ArticlePermission,
} from './types';

// Re-export commonly used errors from centralized errors library
export { ForbiddenError, ValidationError } from '../errors';

// Client (for advanced usage)
export { KetoClient } from './client/keto';

// Domain modules (for advanced usage / testing)
export * as platform from './core/platform';
export * as workspace from './core/workspace';
export { PostsPermissions } from './domains/posts';
export { ArticlesPermissions } from './domains/articles';
export { FilesPermissions } from './domains/files';

// Production features - Observability & Resilience
export type { RetryConfig, CircuitBreakerConfig } from './core/config';
export { DEFAULT_RETRY_CONFIG, DEFAULT_CIRCUIT_BREAKER_CONFIG } from './core/config';
export { 
  permissionsCheckLatency,
  permissionsCheckSuccess,
  permissionsCheckDenied,
  permissionsCheckErrors,
  permissionsWriteLatency,
  permissionsWriteSuccess,
  permissionsWriteErrors,
  permissionsRetryAttempts,
  permissionsCircuitBreakerState,
} from './core/metrics';
export { withPermissionSpan } from './core/telemetry';

// Error utilities
export { classifyKetoError } from './errors/classifyKetoError';
