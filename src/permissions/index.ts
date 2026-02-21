/**
 * @nauticalstream/sdk - Permissions Module
 * 
 * Comprehensive permission management using Ory Keto.
 * 
 * @example
 * ```typescript
 * import { Permissions } from '@nauticalstream/sdk/permissions';
 * 
 * const permissions = new Permissions({ url: 'http://localhost:4467' });
 * 
 * // Bootstrap namespace configuration on startup
 * await permissions.bootstrap();
 * 
 * // Platform permissions
 * const isAdmin = await permissions.platform.hasAdmin(userId);
 * await permissions.platform.grantRole(userId, PlatformRole.ADMIN);
 * 
 * // Workspace permissions
 * const canEdit = await permissions.workspace.hasPermission(
 *   workspaceId, 
 *   userId, 
 *   'edit'
 * );
 * await permissions.workspace.grantRole(
 *   workspaceId, 
 *   userId, 
 *   WorkspaceRole.OWNER
 * );
 * 
 * // Resource permissions
 * const canView = await permissions.resource.hasPermission(
 *   'Post', 
 *   postId, 
 *   userId, 
 *   'view'
 * );
 * await permissions.resource.linkToWorkspace('Post', postId, workspaceId);
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
  ResourcePermission,
} from './types';

// Re-export commonly used errors from centralized errors library
export { ForbiddenError, ValidationError } from '../errors';

// Client (for advanced usage)
export { KetoClient } from './client/keto';

// OPL Configuration (for reference/testing)
export { OPL_NAMESPACE_CONFIG } from './config/namespaces';

// Core modules (for advanced usage)
export * as platform from './core/platform';
export * as workspace from './core/workspace';
export * as resource from './core/resource';

// Production features - Observability & Resilience
export type { HealthStatus } from './core/health';
export { checkHealth } from './core/health';
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
