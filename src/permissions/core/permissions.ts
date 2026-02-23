import { KetoClient } from '../client/keto';
import * as platform from './platform';
import * as workspace from './workspace';
import { PostsPermissions } from '../domains/posts';
import { ArticlesPermissions } from '../domains/articles';
import { FilesPermissions } from '../domains/files';
import { resetCircuitBreaker } from '../../resilience';
import type {
  PermissionsConfig,
  PlatformRole,
  WorkspaceRole,
  WorkspacePermission,
} from '../types';

/** Permissions - Ory Keto permission management */
export class Permissions {
  private client: KetoClient;

  readonly posts: PostsPermissions;
  readonly articles: ArticlesPermissions;
  readonly files: FilesPermissions;

  constructor(config: PermissionsConfig) {
    this.client = new KetoClient(config);
    this.posts = new PostsPermissions(this.client);
    this.articles = new ArticlesPermissions(this.client);
    this.files = new FilesPermissions(this.client);
  }

  /** Platform-level operations */
  readonly platform = {
    hasRole: (userId: string | undefined | null, role: PlatformRole) => 
      platform.hasRole(this.client, userId, role),
    requireRole: (userId: string | undefined | null, role: PlatformRole) => 
      platform.requireRole(this.client, userId, role),
    hasAdmin: (userId: string | undefined | null) => platform.hasAdmin(this.client, userId),
    hasSupport: (userId: string | undefined | null) => platform.hasSupport(this.client, userId),
    requireAdmin: (userId: string | undefined | null) => platform.requireAdmin(this.client, userId),
    requireSupport: (userId: string | undefined | null) => platform.requireSupport(this.client, userId),
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
    hasPermission: (workspaceId: string, userId: string, permission: WorkspacePermission | string) =>
      workspace.hasPermission(this.client, workspaceId, userId, permission),
    requirePermission: (workspaceId: string, userId: string, permission: WorkspacePermission | string) =>
      workspace.requirePermission(this.client, workspaceId, userId, permission),
    listWorkspaces: (userId: string, permission?: WorkspacePermission | string) =>
      workspace.listWorkspaces(this.client, userId, permission),
    grantRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.grantRole(this.client, workspaceId, userId, role),
    revokeRole: (workspaceId: string, userId: string, role: WorkspaceRole) =>
      workspace.revokeRole(this.client, workspaceId, userId, role),
    revokeAllRoles: (workspaceId: string, userId: string) =>
      workspace.revokeAllRoles(this.client, workspaceId, userId),
  };

  /** Reset circuit breaker for specific endpoint */
  resetCircuitBreaker(endpoint: 'read' | 'write'): void {
    resetCircuitBreaker(`keto-${endpoint}`);
  }
}
