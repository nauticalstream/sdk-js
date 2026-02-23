import type { KetoClient } from '../client/keto';
import { PermissionNamespace, PostPermission } from '../types';
import * as resource from '../core/resource';

const NS = PermissionNamespace.POST;

export class PostsPermissions {
  constructor(private readonly client: KetoClient) {}

  hasPermission(postId: string, userId: string, permission: PostPermission): Promise<boolean> {
    return resource.hasPermission(this.client, NS, postId, userId, permission);
  }

  requirePermission(postId: string, userId: string, permission: PostPermission): Promise<void> {
    return resource.requirePermission(this.client, NS, postId, userId, permission);
  }

  grantOwnership(postId: string, userId: string): Promise<void> {
    return resource.grantOwnership(this.client, NS, postId, userId);
  }

  grantPermission(postId: string, userId: string, permission: PostPermission): Promise<void> {
    return resource.grantPermission(this.client, NS, postId, userId, permission);
  }

  revokePermission(postId: string, userId: string, permission: PostPermission): Promise<void> {
    return resource.revokePermission(this.client, NS, postId, userId, permission);
  }

  linkToWorkspace(postId: string, workspaceId: string): Promise<void> {
    return resource.linkToWorkspace(this.client, NS, postId, workspaceId);
  }

  unlinkFromWorkspace(postId: string, workspaceId: string): Promise<void> {
    return resource.unlinkFromWorkspace(this.client, NS, postId, workspaceId);
  }

  list(userId: string, permission: PostPermission = PostPermission.VIEW): Promise<string[]> {
    return resource.listResources(this.client, NS, userId, permission);
  }

  cleanup(postId: string): Promise<void> {
    return resource.cleanupResource(this.client, NS, postId);
  }
}
