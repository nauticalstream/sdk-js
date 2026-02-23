import type { KetoClient } from '../client/keto';
import { ResourcePermission } from '../types';
import { ForbiddenError, ValidationError } from '../../errors';

/** Zero-trust guard: rejects empty or whitespace-only IDs before they reach Keto */
function assertNonEmpty(value: string, name: string): void {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${name} must not be empty`);
  }
}

/**
 * Map ResourcePermission enum to the Keto permission/relation string.
 * Keeps callers type-safe — no raw strings needed.
 */
function resourcePermissionToString(permission: ResourcePermission | string): string {
  if (typeof permission === 'string') return permission;
  switch (permission) {
    case ResourcePermission.VIEW:   return 'view';
    case ResourcePermission.EDIT:   return 'edit';
    case ResourcePermission.DELETE: return 'delete';
    case ResourcePermission.SHARE:  return 'share';
    default: throw new ValidationError(`Invalid resource permission: ${permission}`);
  }
}

/**
 * Check if user has a specific permission on a resource
 */
export async function hasPermission(
  client: KetoClient,
  namespace: string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<boolean> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const permStr = resourcePermissionToString(permission);
  assertNonEmpty(permStr, 'permission');
  const relation = permissionToRelation(permStr);
  const result = await client.permission.checkPermission({
    namespace,
    object: resourceId,
    relation,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific resource permission (throws if not authorized)
 */
export async function requirePermission(
  client: KetoClient,
  namespace: string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  const allowed = await hasPermission(client, namespace, resourceId, userId, permission);
  if (!allowed) {
    throw new ForbiddenError(
      `Permission '${permission}' required for ${namespace}:${resourceId}`
    );
  }
}

/**
 * Grant ownership permission to user on a resource
 */
export async function grantOwnership(
  client: KetoClient,
  namespace: string,
  resourceId: string,
  userId: string
): Promise<void> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace,
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
  namespace: string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const permStr = resourcePermissionToString(permission);
  assertNonEmpty(permStr, 'permission');
  const relation = permissionToRelation(permStr);
  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace,
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
  namespace: string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const permStr = resourcePermissionToString(permission);
  assertNonEmpty(permStr, 'permission');
  const relation = permissionToRelation(permStr);
  await client.relationship.deleteRelationships({
    namespace,
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
  namespace: string,
  resourceId: string,
  workspaceId: string
): Promise<void> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(workspaceId, 'workspaceId');
  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace,
      object: resourceId,
      relation: 'workspaces',
      subject_set: {
        namespace: 'Workspace',
        object: workspaceId,
        relation: 'member',
      },
    },
  });
}

/**
 * Unlink resource from workspace
 */
export async function unlinkFromWorkspace(
  client: KetoClient,
  namespace: string,
  resourceId: string,
  workspaceId: string
): Promise<void> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(workspaceId, 'workspaceId');
  await client.relationship.deleteRelationships({
    namespace,
    object: resourceId,
    relation: 'workspaces',
    subjectSetNamespace: 'Workspace',
    subjectSetObject: workspaceId,
    subjectSetRelation: 'member',
  });
}

/**
 * List all resources where user has a specific permission
 */
export async function listResources(
  client: KetoClient,
  namespace: string,
  userId: string,
  permission: string = 'view'
): Promise<string[]> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(userId, 'userId');
  assertNonEmpty(permission, 'permission');
  const result = await client.relationship.getRelationships({
    namespace,
    relation: permission,
    subjectId: userId,
  });

  return (result.data.relation_tuples || []).map((tuple) => tuple.object || '').filter(Boolean);
}

/**
 * Clean up all permissions for a resource (when deleting)
 */
export async function cleanupResource(
  client: KetoClient,
  namespace: string,
  resourceId: string
): Promise<void> {
  assertNonEmpty(namespace, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  // Delete all tuples where this resource is the object
  await client.relationship.deleteRelationships({
    namespace,
    object: resourceId,
  });
}

/**
 * Map a logical permission string to the corresponding Keto relation.
 * 'view' and 'edit' have plural relation aliases in the OPL;
 * 'delete', 'share', and anything else pass through unchanged as permit names.
 */
function permissionToRelation(permission: string): string {
  const mapping: Record<string, string> = {
    view: 'viewers',
    edit: 'editors',
    own: 'owners',
  };
  return mapping[permission] || permission;
}
