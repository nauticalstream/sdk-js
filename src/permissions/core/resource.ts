import type { KetoClient } from '../client/keto';
import { ForbiddenError } from '../../errors';

/**
 * Check if user has a specific permission on a resource
 */
export async function hasPermission(
  client: KetoClient,
  namespace: string,
  resourceId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const result = await client.permission.checkPermission({
    namespace,
    object: resourceId,
    relation: permission,
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
  permission: string
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
  permission: string
): Promise<void> {
  const relation = permissionToRelation(permission);
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
  permission: string
): Promise<void> {
  const relation = permissionToRelation(permission);
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
  // Delete all tuples where this resource is the object
  await client.relationship.deleteRelationships({
    namespace,
    object: resourceId,
  });
}

/**
 * Convert permission name to relation name
 */
function permissionToRelation(permission: string): string {
  // Map common permission names to plural relation names
  const mapping: Record<string, string> = {
    view: 'viewers',
    edit: 'editors',
    delete: 'owners',
    share: 'owners',
    own: 'owners',
  };

  return mapping[permission] || permission;
}
