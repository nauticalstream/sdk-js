import type { UserInfo } from '../types.js';

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item) => item !== '');
  }

  return undefined;
}

function decodeBase64Json(value: string): Record<string, unknown> | undefined {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function getStringClaim(claims: Record<string, unknown>, key: string): string | undefined {
  const value = claims[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function normalizeUserInfo(
  rawUserInfo: Record<string, unknown> | undefined,
  explicitUserId?: string
): UserInfo | undefined {
  const sub =
    explicitUserId ??
    (rawUserInfo
      ? (
          getStringClaim(rawUserInfo, 'sub') ??
          getStringClaim(rawUserInfo, 'user_id') ??
          getStringClaim(rawUserInfo, 'id')
        )
      : undefined);

  if (!sub) {
    return undefined;
  }

  return {
    ...(rawUserInfo ?? {}),
    sub,
  } as UserInfo;
}

export function extractUserFromHeaders(
  headers: Record<string, string | string[] | undefined>
): UserInfo | undefined {
  const explicitUserId = getHeaderValue(headers['x-user-id']);
  const userinfoHeader = getHeaderValue(headers['x-userinfo']);
  const rawUserInfo = userinfoHeader ? decodeBase64Json(userinfoHeader) : undefined;

  return normalizeUserInfo(rawUserInfo, explicitUserId);
}

export function extractUserIdFromHeaders(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  return extractUserFromHeaders(headers)?.sub;
}
