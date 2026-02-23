import type { KetoClient } from '../client/keto';
import { ForbiddenError, ValidationError } from '../../errors';
import { PermissionNamespace, PostPermission, ArticlePermission, FilePermission } from '../types';

/** Internal union — callers use domain-specific types (PostPermission, ArticlePermission, FilePermission) */
type ResourcePermission = PostPermission | ArticlePermission | FilePermission;

/** Zero-trust guard: rejects empty or whitespace-only IDs before they reach Keto */
function assertNonEmpty(value: string, name: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${name} must not be empty`);
  }
}

/**
 * Convert PermissionNamespace enum to the Keto namespace string (must match OPL class name).
 */
function namespaceToString(namespace: PermissionNamespace | string): string {
  if (typeof namespace === 'string') return namespace;
  switch (namespace) {
    case PermissionNamespace.USER:      return 'User';
    case PermissionNamespace.PLATFORM:  return 'Platform';
    case PermissionNamespace.WORKSPACE: return 'Workspace';
    case PermissionNamespace.POST:      return 'Post';
    case PermissionNamespace.FILE:      return 'File';
    case PermissionNamespace.ARTICLE:   return 'Article';
    default: throw new ValidationError(`Unknown permission namespace: ${namespace}`);
  }
}

/**
 * Convert ResourcePermission enum to the Keto PERMIT name (for checkPermission calls).
 * Keto resolves the OPL permit chain — pass the permit name, not the stored relation.
 * PostPermission / FilePermission / ArticlePermission all share identical numeric values.
 */
function resourcePermissionToPermit(permission: ResourcePermission | string): string {
  if (typeof permission === 'string') return permission;
  switch (permission) {
    case PostPermission.VIEW:   return 'view';
    case PostPermission.EDIT:   return 'edit';
    case PostPermission.DELETE: return 'delete';
    case PostPermission.SHARE:  return 'share';
    default: throw new ValidationError(`Invalid resource permission: ${permission}`);
  }
}

/**
 * Convert ResourcePermission enum to the Keto STORED RELATION name (for relationship writes).
 * VIEW → viewers, EDIT → editors, DELETE/SHARE → owners (delete/share are owner-level).
 */
function resourcePermissionToRelation(permission: ResourcePermission | string): string {
  if (typeof permission === 'string') return permission;
  switch (permission) {
    case PostPermission.VIEW:   return 'viewers';
    case PostPermission.EDIT:   return 'editors';
    case PostPermission.DELETE: return 'owners';
    case PostPermission.SHARE:  return 'owners';
    default: throw new ValidationError(`Invalid resource permission: ${permission}`);
  }
}

/**
 * Check if user has a specific permission on a resource
 */
export async function hasPermission(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<boolean> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const permit = resourcePermissionToPermit(permission);
  assertNonEmpty(permit, 'permission');
  const result = await client.permission.checkPermission({
    namespace: ns,
    object: resourceId,
    relation: permit,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific resource permission (throws if not authorized)
 */
export async function requirePermission(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  const allowed = await hasPermission(client, namespace, resourceId, userId, permission);
  if (!allowed) {
    throw new ForbiddenError(
      `Permission '${permission}' required for ${namespaceToString(namespace)}:${resourceId}`
    );
  }
}

/**
 * Grant ownership permission to user on a resource
 */
export async function grantOwnership(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string
): Promise<void> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: ns,
      object: resourceId,
      relation: 'owners',
      subject_id: userId,
    },
  });
}

/**
 * Grant specific permission to user on a resource
 */
export async function grantPermission(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const relation = resourcePermissionToRelation(permission);
  assertNonEmpty(relation, 'permission');
  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: ns,
      object: resourceId,
      relation,
      subject_id: userId,
    },
  });
}

/**
 * Revoke specific permission from user on a resource
 */
export async function revokePermission(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const relation = resourcePermissionToRelation(permission);
  assertNonEmpty(relation, 'permission');
  await client.relationship.deleteRelationships({
    namespace: ns,
    object: resourceId,
    relation,
    subjectId: userId,
  });
}

/**
 * Link resource to workspace (enables permission inheritance)
 */
export async function linkToWorkspace(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  workspaceId: string
): Promise<void> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(workspaceId, 'workspaceId');
  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: ns,
      object: resourceId,
      relation: 'workspaces',
      subject_set: {
        namespace: namespaceToString(PermissionNamespace.WORKSPACE),
        object: workspaceId,
        relation: '', // empty = reference to the workspace object itself (not a member sub-set)
      },
    },
  });
}

/**
 * Unlink resource from workspace
 */
export async function unlinkFromWorkspace(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  workspaceId: string
): Promise<void> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(workspaceId, 'workspaceId');
  await client.relationship.deleteRelationships({
    namespace: ns,
    object: resourceId,
    relation: 'workspaces',
    subjectSetNamespace: namespaceToString(PermissionNamespace.WORKSPACE),
    subjectSetObject: workspaceId,
    subjectSetRelation: '', // empty = reference to the workspace object itself
  });
}

/**
 * List all resources where user has a specific permission
 */
export async function listResources(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  userId: string,
  permission: ResourcePermission | string = 'view'
): Promise<string[]> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(userId, 'userId');
  const permit = resourcePermissionToPermit(permission);
  assertNonEmpty(permit, 'permission');
  const result = await client.relationship.getRelationships({
    namespace: ns,
    relation: permit,
    subjectId: userId,
  });

  return (result.data.relation_tuples || []).map((tuple) => tuple.object || '').filter(Boolean);
}

/**
 * Clean up all permissions for a resource (when deleting)
 */
export async function cleanupResource(
  client: KetoClient,
  namespace: PermissionNamespace | string,
  resourceId: string
): Promise<void> {
  const ns = namespaceToString(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  // Delete all tuples where this resource is the object
  await client.relationship.deleteRelationships({
    namespace: ns,
    object: resourceId,
  });
}


