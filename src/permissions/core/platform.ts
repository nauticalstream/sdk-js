import type { KetoClient } from '../client/keto';
import { PlatformRole } from '../types';
import { ForbiddenError, ValidationError } from '../../errors';

const PLATFORM_ID = 'global'; // Singleton platform object
const NAMESPACE = 'Platform';

/**
 * Check if user has a specific platform role
 */
export async function hasRole(
  client: KetoClient,
  userId: string,
  role: PlatformRole
): Promise<boolean> {
  const relation = roleToRelation(role);
  if (!relation) {
    throw new ValidationError(`Invalid platform role: ${role}`);
  }

  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: PLATFORM_ID,
    relation,
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require specific platform role (throws if not authorized)
 */
export async function requireRole(
  client: KetoClient,
  userId: string,
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
export async function hasAdmin(client: KetoClient, userId: string): Promise<boolean> {
  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: PLATFORM_ID,
    relation: 'admin',
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Check if user has platform support role
 */
export async function hasSupport(client: KetoClient, userId: string): Promise<boolean> {
  const result = await client.permission.checkPermission({
    namespace: NAMESPACE,
    object: PLATFORM_ID,
    relation: 'support',
    subjectId: userId,
  });
  return result.data.allowed === true;
}

/**
 * Require platform admin role (throws if not authorized)
 */
export async function requireAdmin(client: KetoClient, userId: string): Promise<void> {
  const allowed = await hasAdmin(client, userId);
  if (!allowed) {
    throw new ForbiddenError('Platform admin permission required');
  }
}

/**
 * Require platform support role (throws if not authorized)
 */
export async function requireSupport(client: KetoClient, userId: string): Promise<void> {
  const allowed = await hasSupport(client, userId);
  if (!allowed) {
    throw new ForbiddenError('Platform support permission required');
  }
}

/**
 * Grant platform role to user
 */
export async function grantRole(
  client: KetoClient,
  userId: string,
  role: PlatformRole
): Promise<void> {
  const relation = roleToRelation(role);
  if (!relation) {
    throw new Error(`Invalid platform role: ${role}`);
  }

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
  client: KetoClient,
  userId: string,
  role: PlatformRole
): Promise<void> {
  const relation = roleToRelation(role);
  if (!relation) {
    throw new ValidationError(`Invalid platform role: ${role}`);
  }

  await client.relationship.deleteRelationships({
    namespace: NAMESPACE,
    object: PLATFORM_ID,
    relation,
    subjectId: userId,
  });
}

/**
 * Convert platform role enum to Keto relation name
 */
function roleToRelation(role: PlatformRole): string | null {
  switch (role) {
    case PlatformRole.ADMIN:
      return 'admins';
    case PlatformRole.SUPPORT:
      return 'support';
    default:
      return null;
  }
}
