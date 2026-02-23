import { KetoClient } from '../client/keto';
import * as platform from './platform';
import * as workspace from './workspace';
import * as resource from './resource';
import { checkHealth, type HealthStatus } from './health';
import { resetCircuitBreaker } from '../../resilience';
import { defaultLogger } from '../utils/logger';
import type { Logger } from 'pino';
import type { PermissionsConfig, PlatformRole, WorkspaceRole } from '../types';

/** Permissions - Ory Keto permission management */
export class Permissions {
  private client: KetoClient;
  private logger: Logger;

  constructor(config: PermissionsConfig) {
    this.client = new KetoClient(config);
    this.logger = config.logger || defaultLogger.child({ service: 'permissions' });
  }

  /** Bootstrap permissions client (call on service startup) */
  async bootstrap(): Promise<void> {
    // Check Keto health (both read and write endpoints)
    const health = await checkHealth(this.client);
    
    if (!health.healthy) {
      this.logger.error(
        { 
          readEndpoint: health.readEndpoint,
          writeEndpoint: health.writeEndpoint,
          latency: health.latency 
        },
        'Keto health check failed'
      );
      throw new Error('Keto is not healthy - cannot initialize permissions');
    }

    this.logger.info(
      { 
        readEndpoint: health.readEndpoint,
        writeEndpoint: health.writeEndpoint,
        latency: health.latency 
      },
      'Permissions (Ory Keto) initialized'
    );
  }

  /** Platform-level operations */
  readonly platform = {
    hasRole: (userId: string, role: PlatformRole) => 
      platform.hasRole(this.client, userId, role),
    requireRole: (userId: string, role: PlatformRole) => 
      platform.requireRole(this.client, userId, role),
    hasAdmin: (userId: string) => platform.hasAdmin(this.client, userId),
    hasSupport: (userId: string) => platform.hasSupport(this.client, userId),
    requireAdmin: (userId: string) => platform.requireAdmin(this.client, userId),
    requireSupport: (userId: string) => platform.requireSupport(this.client, userId),
    grantRole: (userId: string, role: PlatformRole) => 
      platform.grantRole(this.client, userId, role),
    revokeRole: (userId: string, role: PlatformRole) => 
      platform.revokeRole(this.client, userId, role),
  };

  /** Workspace-level operations */
  readonly workspace = {
    hasRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.hasRole(this.client, workspaceId, userId, role),
    requireRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.requireRole(this.client, workspaceId, userId, role),
    hasPermission: (workspaceId: string, userId: string, permission: string) =>
      workspace.hasPermission(this.client, workspaceId, userId, permission),
    requirePermission: (workspaceId: string, userId: string, permission: string) =>
      workspace.requirePermission(this.client, workspaceId, userId, permission),
    listWorkspaces: (userId: string, permission?: string) =>
      workspace.listWorkspaces(this.client, userId, permission),
    grantRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.grantRole(this.client, workspaceId, userId, role),
    revokeRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.revokeRole(this.client, workspaceId, userId, role),
    revokeAllRoles: (workspaceId: string, userId: string) =>
      workspace.revokeAllRoles(this.client, workspaceId, userId),
  };

  /** Resource-level operations */
  readonly resource = {
    hasPermission: (namespace: string, resourceId: string, userId: string, permission: string) =>
      resource.hasPermission(this.client, namespace, resourceId, userId, permission),
    requirePermission: (namespace: string, resourceId: string, userId: string, permission: string) =>
      resource.requirePermission(this.client, namespace, resourceId, userId, permission),
    grantOwnership: (namespace: string, resourceId: string, userId: string) =>
      resource.grantOwnership(this.client, namespace, resourceId, userId),
    grantPermission: (namespace: string, resourceId: string, userId: string, permission: string) =>
      resource.grantPermission(this.client, namespace, resourceId, userId, permission),
    revokePermission: (namespace: string, resourceId: string, userId: string, permission: string) =>
      resource.revokePermission(this.client, namespace, resourceId, userId, permission),
    linkToWorkspace: (namespace: string, resourceId: string, workspaceId: string) =>
      resource.linkToWorkspace(this.client, namespace, resourceId, workspaceId),
    unlinkFromWorkspace: (namespace: string, resourceId: string, workspaceId: string) =>
      resource.unlinkFromWorkspace(this.client, namespace, resourceId, workspaceId),
    listResources: (namespace: string, userId: string, permission?: string) =>
      resource.listResources(this.client, namespace, userId, permission),
    cleanupResource: (namespace: string, resourceId: string) =>
      resource.cleanupResource(this.client, namespace, resourceId),
  };

  /** Check health of Keto endpoints */
  async healthCheck(): Promise<HealthStatus> {
    return checkHealth(this.client);
  }

  /** Reset circuit breaker for specific endpoint */
  resetCircuitBreaker(endpoint: 'read' | 'write'): void {
    resetCircuitBreaker(`keto-${endpoint}`);
  }
}
