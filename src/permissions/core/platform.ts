import type { PermissionClient } from '../client/permission-client.js';
import { PlatformRole } from '../domains/platform.js';
import { ForbiddenError } from '../../errors/index.js';

const PLATFORM_ID = 'global'; // Singleton platform object
const NAMESPACE = 'platform';

function platformRoleToRelation(role: PlatformRole): string {
  return `${role}_role`;
}

/**
 * Guard: throws ForbiddenError so unauthenticated callers get a 403,
 * not a 400/500. All permission checks flow naturally through error handler.
 */
function assertUserId(userId: string | undefined | null): asserts userId is string {
  if (!userId || userId.trim().length === 0) {
    throw new ForbiddenError('Authentication required');
  }
}

/**
 * Check if user has a specific platform role
 */
export async function hasRole(
  client: PermissionClient,
  userId: string | undefined | null,
  role: PlatformRole
): Promise<boolean> {
  assertUserId(userId);

  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: PLATFORM_ID,
    relation: role,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific platform role (throws if not authorized)
 */
export async function requireRole(
  client: PermissionClient,
  userId: string | undefined | null,
  role: PlatformRole
): Promise<void> {
  const allowed = await hasRole(client, userId, role);
  if (!allowed) {
    throw new ForbiddenError(`Platform role ${role} required`);
  }
}

/**
 * Check if user has platform admin role
 */
export async function hasAdmin(client: PermissionClient, userId: string | undefined | null): Promise<boolean> {
  return hasRole(client, userId, PlatformRole.ADMIN);
}

/**
 * Check if user has platform support role
 */
export async function hasSupport(client: PermissionClient, userId: string | undefined | null): Promise<boolean> {
  return hasRole(client, userId, PlatformRole.SUPPORT);
}

/**
 * Require platform admin role (throws if not authorized)
 */
export async function requireAdmin(client: PermissionClient, userId: string | undefined | null): Promise<void> {
  const allowed = await hasAdmin(client, userId);
  if (!allowed) {
    throw new ForbiddenError('Platform admin permission required');
  }
}

/**
 * Require platform support role (throws if not authorized)
 */
export async function requireSupport(client: PermissionClient, userId: string | undefined | null): Promise<void> {
  const allowed = await hasSupport(client, userId);
  if (!allowed) {
    throw new ForbiddenError('Platform support permission required');
  }
}

/**
 * Grant platform role to user
 */
export async function grantRole(
  client: PermissionClient,
  userId: string,
  role: PlatformRole
): Promise<void> {
  assertUserId(userId);
  const relation = platformRoleToRelation(role);

  await client.relationship.createRelationship({
    createRelationshipBody: {
      namespace: NAMESPACE,
      object: PLATFORM_ID,
      relation,
      subject_id: userId,
    },
  });
}

/**
 * Revoke platform role from user
 */
export async function revokeRole(
  client: PermissionClient,
  userId: string,
  role: PlatformRole
): Promise<void> {
  assertUserId(userId);
  const relation = platformRoleToRelation(role);

  await client.relationship.deleteRelationships({
    namespace: NAMESPACE,
    object: PLATFORM_ID,
    relation,
    subjectId: userId,
  });
}

