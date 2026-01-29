import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface D1PreparedStatement<T> {
  bind: (..._values: unknown[]) => D1PreparedStatement<T>;
  first: <R = T>() => Promise<R | null>;
}

export interface D1DatabaseLike {
  prepare: <T = unknown>(_query: string) => D1PreparedStatement<T>;
}

export interface AccessIdentity {
  userId: string;
  tenantId: string;
  role: string;
  email: string | null;
}

export class AccessAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AccessAuthError';
    this.status = status;
  }
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteJwks(url: string) {
  const cached = jwksCache.get(url);
  if (cached) {
    return cached;
  }
  const jwks = createRemoteJWKSet(new URL(url));
  jwksCache.set(url, jwks);
  return jwks;
}

interface AccessClaims {
  iss: string;
  sub: string;
  email?: string;
  name?: string;
  common_name?: string;
}

interface AccessIdentityRow {
  user_id: string;
  tenant_id: string;
  role: string;
  email: string | null;
}

export async function resolveAccessIdentity(
  db: D1DatabaseLike,
  issuer: string,
  subject: string
): Promise<AccessIdentity | null> {
  const row = await db
    .prepare<AccessIdentityRow>(
      `
      SELECT
        u.id AS user_id,
        u.tenant_id AS tenant_id,
        u.role AS role,
        u.email AS email
      FROM access_identities ai
      JOIN users u ON u.id = ai.user_id
      WHERE ai.issuer = ? AND ai.subject = ?
      LIMIT 1
      `.trim()
    )
    .bind(issuer, subject)
    .first();

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    role: row.role,
    email: row.email,
  };
}

export async function authenticateAccessToken(params: {
  db: D1DatabaseLike;
  token: string | null;
  jwksUrl: string | null;
  audience: string | null;
  issuer: string | null;
}): Promise<AccessIdentity> {
  if (!params.token) {
    throw new AccessAuthError('Missing access token', 401);
  }
  if (!params.jwksUrl || !params.audience) {
    throw new AccessAuthError('Access auth is not configured', 500);
  }

  const jwks = getRemoteJwks(params.jwksUrl);
  const { payload } = await jwtVerify(params.token, jwks, {
    audience: params.audience,
    issuer: params.issuer ?? undefined,
  });

  const claims = payload as AccessClaims;
  const subject = claims.sub || claims.common_name || '';
  if (!claims.iss || !subject) {
    throw new AccessAuthError('Invalid access token', 401);
  }

  const identity = await resolveAccessIdentity(params.db, claims.iss, subject);
  if (!identity) {
    throw new AccessAuthError('Access identity not mapped', 403);
  }

  return identity;
}
