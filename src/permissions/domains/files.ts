import type { KetoClient } from '../client/keto';
import { PermissionNamespace, FilePermission } from '../types';
import * as resource from '../core/resource';

const NS = PermissionNamespace.FILE;

export class FilesPermissions {
  constructor(private readonly client: KetoClient) {}

  hasPermission(fileId: string, userId: string, permission: FilePermission): Promise<boolean> {
    return resource.hasPermission(this.client, NS, fileId, userId, permission);
  }

  requirePermission(fileId: string, userId: string, permission: FilePermission): Promise<void> {
    return resource.requirePermission(this.client, NS, fileId, userId, permission);
  }

  grantOwnership(fileId: string, userId: string): Promise<void> {
    return resource.grantOwnership(this.client, NS, fileId, userId);
  }

  grantPermission(fileId: string, userId: string, permission: FilePermission): Promise<void> {
    return resource.grantPermission(this.client, NS, fileId, userId, permission);
  }

  revokePermission(fileId: string, userId: string, permission: FilePermission): Promise<void> {
    return resource.revokePermission(this.client, NS, fileId, userId, permission);
  }

  linkToWorkspace(fileId: string, workspaceId: string): Promise<void> {
    return resource.linkToWorkspace(this.client, NS, fileId, workspaceId);
  }

  unlinkFromWorkspace(fileId: string, workspaceId: string): Promise<void> {
    return resource.unlinkFromWorkspace(this.client, NS, fileId, workspaceId);
  }

  list(userId: string, permission: FilePermission = FilePermission.VIEW): Promise<string[]> {
    return resource.listResources(this.client, NS, userId, permission);
  }

  cleanup(fileId: string): Promise<void> {
    return resource.cleanupResource(this.client, NS, fileId);
  }
}
