import type { KetoClient } from '../client/keto';
import { PermissionNamespace, ArticlePermission } from '../types';
import * as resource from '../core/resource';

const NS = PermissionNamespace.ARTICLE;

export class ArticlesPermissions {
  constructor(private readonly client: KetoClient) {}

  hasPermission(articleId: string, userId: string, permission: ArticlePermission): Promise<boolean> {
    return resource.hasPermission(this.client, NS, articleId, userId, permission);
  }

  requirePermission(articleId: string, userId: string, permission: ArticlePermission): Promise<void> {
    return resource.requirePermission(this.client, NS, articleId, userId, permission);
  }

  grantOwnership(articleId: string, userId: string): Promise<void> {
    return resource.grantOwnership(this.client, NS, articleId, userId);
  }

  grantPermission(articleId: string, userId: string, permission: ArticlePermission): Promise<void> {
    return resource.grantPermission(this.client, NS, articleId, userId, permission);
  }

  revokePermission(articleId: string, userId: string, permission: ArticlePermission): Promise<void> {
    return resource.revokePermission(this.client, NS, articleId, userId, permission);
  }

  linkToWorkspace(articleId: string, workspaceId: string): Promise<void> {
    return resource.linkToWorkspace(this.client, NS, articleId, workspaceId);
  }

  unlinkFromWorkspace(articleId: string, workspaceId: string): Promise<void> {
    return resource.unlinkFromWorkspace(this.client, NS, articleId, workspaceId);
  }

  list(userId: string, permission: ArticlePermission = ArticlePermission.VIEW): Promise<string[]> {
    return resource.listResources(this.client, NS, userId, permission);
  }

  cleanup(articleId: string): Promise<void> {
    return resource.cleanupResource(this.client, NS, articleId);
  }
}
