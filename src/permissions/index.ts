/**
 * @nauticalstream/sdk - Permissions Module
 * 
 * Comprehensive permission management using a shared permissions backend.
 * 
 * @example
 * ```typescript
 * import { Permissions } from '@nauticalstream/sdk/permissions';
 * 
 * const permissions = new Permissions({ endpoint: 'permissions:50051', token: '...' });
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
 *
 * // Generic resource permissions for new schema types
 * await permissions.resource('comment').requirePermission(commentId, userId, 'edit');
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

export { PlatformRole } from './domains/platform';
export { WorkspacePermission, WorkspaceRole } from './domains/workspace';

// Re-export commonly used errors from centralized errors library
export { ForbiddenError, ValidationError } from '../errors';

// Client (for advanced usage)
export { PermissionClient } from './client/permission-client';

// Domain modules (for advanced usage / testing)
export * as platform from './core/platform';
export * as workspace from './core/workspace';
export {
  PermissionNamespace,
  ResourcePermissions,
  PostsPermissions,
  ArticlesPermissions,
  FilesPermissions,
  PostPermission,
  FilePermission,
  ArticlePermission,
} from './domains/resource';
export type {
  ArticleTopicPermission,
  BoatPermission,
  BusinessPermission,
  CatalogProductPermission,
  CollectionPermission,
  ChatMessageRequestPermission,
  CommentPermission,
  ConnectedEmailAccountPermission,
  LikePermission,
  FollowPermission,
  StorageCollectionPermission,
  WorkspaceCategoryPermission,
  WorkspaceFeaturePermission,
  EventPermission,
  EventTicketSpecificationPermission,
  TourPermission,
  CruisePermission,
  ItineraryPermission,
  CustomerPermission,
  LeadPermission,
  LeadStagePermission,
  ChatConversationPermission,
  ChatMessagePermission,
  PlacePermission,
  PriceConfigurationPermission,
  StreamPermission,
  NotePermission,
  VerificationSessionPermission,
} from './domains/resource';

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
export { classifyPermissionError } from './errors/classifyPermissionError';
