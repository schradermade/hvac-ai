import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';

export type AppJwtIdentity = {
  userId: string;
  tenantId: string;
  role: string;
};

export async function authenticateAppJwt(params: {
  token: string;
  jwksUrl: string;
  issuer: string;
  audience: string;
  jwksFetcher?: () => Promise<JSONWebKeySet>;
}): Promise<AppJwtIdentity> {
  const jwks = params.jwksFetcher
    ? createLocalJWKSet(await params.jwksFetcher())
    : createRemoteJWKSet(new URL(params.jwksUrl));
  const { payload } = await jwtVerify(params.token, jwks, {
    issuer: params.issuer,
    audience: params.audience,
  });

  const tenantId = String(payload.tenant_id ?? '');
  const userId = String(payload.sub ?? '');
  const role = String(payload.role ?? 'technician');

  if (!tenantId || !userId) {
    throw new Error('Missing tenant_id or sub in JWT');
  }

  return { tenantId, userId, role };
}
