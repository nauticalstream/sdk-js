import type { PermissionClient } from '../client/permission-client.js';
import { ForbiddenError } from '../../errors/index.js';
import { PermissionNamespace, type PostPermission, type ArticlePermission, type FilePermission } from '../domains/resource.js';
import type { PermissionConsistency, PermissionWriteResult } from '../types.js';
import { assertNonEmpty } from '../utils/validation.js';

/** Internal union — callers use domain-specific resource permission types. */
type ResourcePermission = PostPermission | ArticlePermission | FilePermission;

/**
 * Convert direct permission names to the owning SpiceDB relation.
 */
function resourcePermissionToRelation(permission: ResourcePermission | string): string {
  switch (permission) {
    case 'view':
      return 'viewer';
    case 'edit':
      return 'editor';
    case 'delete':
    case 'share':
      return 'owner';
    default:
      return String(permission);
  }
}

/**
 * Check if user has a specific permission on a resource
 */
export async function hasPermission(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string,
  consistency?: PermissionConsistency
): Promise<boolean> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const permit = String(permission);
  assertNonEmpty(permit, 'permission');
  const checkPermission = client.permission?.checkPermission ?? (client as unknown as {
    checkPermission?: PermissionClient['permission']['checkPermission'];
  }).checkPermission;
  const result = await checkPermission?.({
    namespace: ns,
    object: resourceId,
    relation: permit,
    subjectId: userId,
    ...(consistency ? { consistency } : {}),
  });
  return result.data.allowed === true;
}

/**
 * Require specific resource permission (throws if not authorized)
 */
export async function requirePermission(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string,
  consistency?: PermissionConsistency
): Promise<void> {
  const allowed = await hasPermission(client, namespace, resourceId, userId, permission, consistency);
  if (!allowed) {
    throw new ForbiddenError(
      `Permission '${permission}' required for ${String(namespace)}:${resourceId}`
    );
  }
}

/**
 * Grant ownership permission to user on a resource
 */
export async function grantOwnership(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string
): Promise<PermissionWriteResult> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const result = await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: ns,
      object: resourceId,
      relation: 'owner',
      subject_id: userId,
    },
  });
  return { writtenAt: result?.writtenAt };
}

/**
 * Grant specific permission to user on a resource
 */
export async function grantPermission(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<PermissionWriteResult> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(userId, 'userId');
  const relation = resourcePermissionToRelation(permission);
  assertNonEmpty(relation, 'permission');
  const result = await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: ns,
      object: resourceId,
      relation,
      subject_id: userId,
    },
  });
  return { writtenAt: result?.writtenAt };
}

/**
 * Revoke specific permission from user on a resource
 */
export async function revokePermission(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  userId: string,
  permission: ResourcePermission | string
): Promise<void> {
  const ns = String(namespace);
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
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  workspaceId: string
): Promise<PermissionWriteResult> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(workspaceId, 'workspaceId');
  const result = await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: ns,
      object: resourceId,
      relation: 'workspace',
      subject_set: {
        namespace: PermissionNamespace.WORKSPACE,
        object: workspaceId,
        relation: '', // empty = reference to the workspace object itself (not a member sub-set)
      },
    },
  });
  return { writtenAt: result?.writtenAt };
}

/**
 * Unlink resource from workspace
 */
export async function unlinkFromWorkspace(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string,
  workspaceId: string
): Promise<void> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  assertNonEmpty(workspaceId, 'workspaceId');
  await client.relationship.deleteRelationships({
    namespace: ns,
    object: resourceId,
    relation: 'workspace',
    subjectSetNamespace: PermissionNamespace.WORKSPACE,
    subjectSetObject: workspaceId,
    subjectSetRelation: '', // empty = reference to the workspace object itself
  });
}

/**
 * List all resources where user has a specific permission
 */
export async function listResources(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  userId: string,
  permission: ResourcePermission | string = 'view',
  consistency?: PermissionConsistency
): Promise<string[]> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(userId, 'userId');
  const permit = String(permission);
  assertNonEmpty(permit, 'permission');
  return client.lookupResources({
    namespace: ns,
    permission: permit,
    subjectId: userId,
    ...(consistency ? { consistency } : {}),
  });
}

/**
 * Clean up all permissions for a resource (when deleting)
 */
export async function cleanupResource(
  client: PermissionClient,
  namespace: PermissionNamespace | string,
  resourceId: string
): Promise<void> {
  const ns = String(namespace);
  assertNonEmpty(ns, 'namespace');
  assertNonEmpty(resourceId, 'resourceId');
  // Delete all tuples where this resource is the object
  await client.relationship.deleteRelationships({
    namespace: ns,
    object: resourceId,
  });
}


