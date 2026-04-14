import type { ContextHeaders, HeaderValue, IdentityContext, UserInfo } from '../types.js';

function getHeaderValue(value: HeaderValue): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item) => item !== '');
  }

  return undefined;
}

function getHeader(headers: ContextHeaders, name: string): string | undefined {
  const normalizedName = name.toLowerCase();
  return getHeaderValue(headers[normalizedName] ?? headers[name]);
}

function extractBearerToken(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match?.[1] || undefined;
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

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  const parts = token.split('.');
  if (parts.length < 2) {
    return undefined;
  }

  return decodeBase64Json(parts[1]);
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

export function extractIdentityFromHeaders(headers: ContextHeaders): IdentityContext | undefined {
  const explicitUserId = getHeader(headers, 'x-user-id');
  const workspaceId = getHeader(headers, 'x-workspace-id');
  const authorization = getHeader(headers, 'authorization');
  const userinfoHeader = getHeader(headers, 'x-userinfo');
  const accessToken = getHeader(headers, 'x-access-token') ?? extractBearerToken(authorization);
  const idToken = getHeader(headers, 'x-id-token');
  const rawUserInfo = userinfoHeader ? decodeBase64Json(userinfoHeader) : undefined;
  const accessTokenClaims = accessToken ? decodeJwtPayload(accessToken) : undefined;
  const claimSource = rawUserInfo ? { ...(accessTokenClaims ?? {}), ...rawUserInfo } : accessTokenClaims;
  const user = normalizeUserInfo(claimSource, explicitUserId);

  if (!user && !workspaceId && !authorization && !accessToken && !idToken && !rawUserInfo && !accessTokenClaims) {
    return undefined;
  }

  const clientId = claimSource ? getStringClaim(claimSource, 'client_id') : undefined;

  return {
    ...(claimSource ?? {}),
    sub: user?.sub,
    userId: explicitUserId ?? user?.sub,
    workspaceId,
    clientId,
    client_id: clientId,
    scp: Array.isArray(claimSource?.scp)
      ? claimSource.scp.filter((scope): scope is string => typeof scope === 'string')
      : undefined,
    jti: claimSource ? getStringClaim(claimSource, 'jti') : undefined,
    iss: claimSource ? getStringClaim(claimSource, 'iss') : undefined,
    ext: claimSource && typeof claimSource.ext === 'object' && claimSource.ext !== null
      ? (claimSource.ext as UserInfo['ext'])
      : undefined,
    iat: claimSource && typeof claimSource.iat === 'number' ? claimSource.iat : undefined,
    nbf: claimSource && typeof claimSource.nbf === 'number' ? claimSource.nbf : undefined,
    aud:
      claimSource && (typeof claimSource.aud === 'string' || Array.isArray(claimSource.aud))
        ? (claimSource.aud as string | string[])
        : undefined,
    exp: claimSource && typeof claimSource.exp === 'number' ? claimSource.exp : undefined,
    authorization,
    accessToken,
    idToken,
    rawUserInfo,
    headers,
    getHeader: (name: string) => getHeader(headers, name),
  };
}

export function extractUserFromHeaders(
  headers: ContextHeaders
): UserInfo | undefined {
  const identity = extractIdentityFromHeaders(headers);
  if (!identity?.sub) {
    return undefined;
  }

  return {
    ...(identity.rawUserInfo ?? identity),
    sub: identity.sub,
  } as UserInfo;
}

export function extractUserIdFromHeaders(
  headers: ContextHeaders
): string | undefined {
  return extractUserFromHeaders(headers)?.sub;
}
