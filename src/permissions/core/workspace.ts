import type { KetoClient } from '../client/keto';
import { WorkspaceRole } from '../types';
import { ForbiddenError, ValidationError } from '../../errors';

const NAMESPACE = 'Workspace';

/**
 * Check if user has a specific workspace role
 */
export async function hasRole(
  client: KetoClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<boolean> {
  const relation = roleToRelation(role);
  if (!relation) {
    throw new ValidationError(`Invalid workspace role: ${role}`);
  }

  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: workspaceId,
    relation,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific workspace role (throws if not authorized)
 */
export async function requireRole(
  client: KetoClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<void> {
  const allowed = await hasRole(client, workspaceId, userId, role);
  if (!allowed) {
    throw new ForbiddenError(
      `Workspace role ${role} required for workspace ${workspaceId}`
    );
  }
}

/**
 * Check if user has a specific permission in a workspace
 */
export async function hasPermission(
  client: KetoClient,
  workspaceId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: workspaceId,
    relation: permission,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific workspace permission (throws if not authorized)
 */
export async function requirePermission(
  client: KetoClient,
  workspaceId: string,
  userId: string,
  permission: string
): Promise<void> {
  const allowed = await hasPermission(client, workspaceId, userId, permission);
  if (!allowed) {
    throw new ForbiddenError(
      `Workspace permission '${permission}' required for workspace ${workspaceId}`
    );
  }
}

/**
 * List all workspaces where user has a specific permission
 */
export async function listWorkspaces(
  client: KetoClient,
  userId: string,
  permission: string = 'view'
): Promise<string[]> {
  const result = await client.relationship.getRelationships({
    namespace: NAMESPACE,
    relation: permission,
    subjectId: userId,
  });

  return (result.data.relation_tuples || []).map((tuple) => tuple.object || '').filter(Boolean);
}

/**
 * Grant workspace role to user
 */
export async function grantRole(
  client: KetoClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<void> {
  const relation = roleToRelation(role);
  if (!relation) {
    throw new Error(`Invalid workspace role: ${role}`);
  }

  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: NAMESPACE,
      object: workspaceId,
      relation,
      subject_id: userId,
    },
  });
}

/**
 * Revoke workspace role from user
 */
export async function revokeRole(
  client: KetoClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<void> {
  const relation = roleToRelation(role);
  if (!relation) {
    throw new ValidationError(`Invalid workspace role: ${role}`);
  }

  await client.relationship.deleteRelationships({
    namespace: NAMESPACE,
    object: workspaceId,
    relation,
    subjectId: userId,
  });
}

/**
 * Revoke all workspace roles from user
 */
export async function revokeAllRoles(
  client: KetoClient,
  workspaceId: string,
  userId: string
): Promise<void> {
  const roles = [
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER,
  ];

  for (const role of roles) {
    try {
      await revokeRole(client, workspaceId, userId, role);
    } catch (error) {
      // Ignore errors (role might not exist)
    }
  }
}

/**
 * Convert workspace role enum to Keto relation name
 */
function roleToRelation(role: WorkspaceRole): string | null {
  switch (role) {
    case WorkspaceRole.OWNER:
      return 'owners';
    case WorkspaceRole.ADMIN:
      return 'admins';
    case WorkspaceRole.MEMBER:
      return 'members';
    case WorkspaceRole.VIEWER:
      return 'viewers';
    default:
      return null;
  }
}
