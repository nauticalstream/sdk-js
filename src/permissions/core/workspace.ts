import type { PermissionClient } from '../client/permission-client';
import { WorkspacePermission, WorkspaceRole } from '../domains/workspace';
import { ForbiddenError, ValidationError, NotFoundError } from '../../errors';
import { assertNonEmpty } from '../utils/validation';

const NAMESPACE = 'workspace';

function workspaceRoleToRelation(role: WorkspaceRole): string {
  if (role === WorkspaceRole.UNSPECIFIED) {
    throw new ValidationError(`Invalid workspace role: ${role}`);
  }

  return role;
}
/**
 * Check if user has a specific workspace role
 */
export async function hasRole(
  client: PermissionClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<boolean> {
  assertNonEmpty(workspaceId, 'workspaceId');
  assertNonEmpty(userId, 'userId');
  const relation = workspaceRoleToRelation(role);

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
  client: PermissionClient,
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
  client: PermissionClient,
  workspaceId: string,
  userId: string,
  permission: WorkspacePermission | string
): Promise<boolean> {
  assertNonEmpty(workspaceId, 'workspaceId');
  assertNonEmpty(userId, 'userId');
  const permit = String(permission);
  assertNonEmpty(permit, 'permission');
  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: workspaceId,
    relation: permit,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific workspace permission (throws if not authorized)
 */
export async function requirePermission(
  client: PermissionClient,
  workspaceId: string,
  userId: string,
  permission: WorkspacePermission | string
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
  client: PermissionClient,
  userId: string,
  permission: WorkspacePermission | string = WorkspacePermission.VIEW
): Promise<string[]> {
  assertNonEmpty(userId, 'userId');
  const permit = String(permission);
  assertNonEmpty(permit, 'permission');
  return client.lookupResources({
    namespace: NAMESPACE,
    permission: permit,
    subjectId: userId,
  });
}

/**
 * Grant workspace role to user
 */
export async function grantRole(
  client: PermissionClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<void> {
  assertNonEmpty(workspaceId, 'workspaceId');
  assertNonEmpty(userId, 'userId');
  const relation = workspaceRoleToRelation(role);

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
  client: PermissionClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<void> {
  const relation = workspaceRoleToRelation(role);

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
  client: PermissionClient,
  workspaceId: string,
  userId: string
): Promise<void> {
  assertNonEmpty(workspaceId, 'workspaceId');
  assertNonEmpty(userId, 'userId');
  const roles = [
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER,
  ];

  // Run in parallel — independent operations. Only ignore 404 (role not held);
  // re-throw everything else so callers know the revoke was incomplete.
  await Promise.all(
    roles.map(async (role) => {
      try {
        await revokeRole(client, workspaceId, userId, role);
      } catch (error) {
        if (!(error instanceof NotFoundError)) {
          throw error;
        }
      }
    })
  );
}

