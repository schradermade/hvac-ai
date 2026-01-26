import { Hono } from 'hono';
import { SignJWT, createRemoteJWKSet, jwtVerify, exportJWK, importPKCS8 } from 'jose';

type AuthEnv = {
  AUTH_DB: D1Database;
  AUTH_OIDC_ISSUER: string;
  AUTH_OIDC_CLIENT_ID: string;
  AUTH_OIDC_CLIENT_SECRET: string;
  AUTH_OIDC_REDIRECT_URL: string;
  AUTH_JWT_ISSUER: string;
  AUTH_JWT_AUDIENCE: string;
  AUTH_JWT_PRIVATE_KEY: string;
  AUTH_JWT_KID?: string;
  AUTH_DEFAULT_TENANT_ID?: string;
  AUTH_ACCESS_TOKEN_TTL_MIN?: string;
  AUTH_REFRESH_TOKEN_TTL_DAYS?: string;
};

type AppEnv = { Bindings: AuthEnv };

const app = new Hono<AppEnv>();

const jsonHeaders = { 'Content-Type': 'application/json' };

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getJwtKey(env: AuthEnv) {
  return importPKCS8(env.AUTH_JWT_PRIVATE_KEY, 'RS256', { extractable: true });
}

async function issueAccessToken(env: AuthEnv, user: AuthUser) {
  const key = await getJwtKey(env);
  const kid = env.AUTH_JWT_KID ?? 'auth-1';
  const ttlMinutes = parseNumber(env.AUTH_ACCESS_TOKEN_TTL_MIN, 15);
  const now = nowSeconds();

  return new SignJWT({
    tenant_id: user.tenantId,
    role: user.role,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setSubject(user.id)
    .setIssuer(env.AUTH_JWT_ISSUER)
    .setAudience(env.AUTH_JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlMinutes * 60)
    .setJti(crypto.randomUUID())
    .sign(key);
}

async function issueRefreshToken(env: AuthEnv, user: AuthUser) {
  const token = crypto.randomUUID();
  const hash = await sha256(token);
  const ttlDays = parseNumber(env.AUTH_REFRESH_TOKEN_TTL_DAYS, 30);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

  await env.AUTH_DB.prepare(
    `
    INSERT INTO refresh_tokens (
      id,
      user_id,
      tenant_id,
      token_hash,
      expires_at
    ) VALUES (?, ?, ?, ?, ?)
    `.trim()
  )
    .bind(crypto.randomUUID(), user.id, user.tenantId, hash, expiresAt)
    .run();

  return { token, expiresAt };
}

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

async function getUserById(env: AuthEnv, id: string) {
  return env.AUTH_DB.prepare(
    `
    SELECT id, email, name, role, tenant_id
    FROM users
    WHERE id = ?
    LIMIT 1
    `.trim()
  )
    .bind(id)
    .first<{ id: string; email: string; name: string; role: string; tenant_id: string }>();
}

async function upsertUser(env: AuthEnv, payload: AuthUser) {
  await env.AUTH_DB.prepare(
    `
    INSERT INTO users (id, email, name, role, tenant_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      role = COALESCE(users.role, excluded.role),
      tenant_id = excluded.tenant_id,
      updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    `.trim()
  )
    .bind(payload.id, payload.email, payload.name, payload.role, payload.tenantId)
    .run();

  return payload;
}

async function exchangeAccessCode(env: AuthEnv, code: string, codeVerifier: string) {
  const tokenUrl = new URL(`${env.AUTH_OIDC_ISSUER.replace(/\/+$/, '')}/token`);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.AUTH_OIDC_CLIENT_ID,
    client_secret: env.AUTH_OIDC_CLIENT_SECRET,
    code,
    code_verifier: codeVerifier,
    redirect_uri: env.AUTH_OIDC_REDIRECT_URL,
  });

  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'OIDC token exchange failed');
  }

  return response.json() as Promise<{
    id_token: string;
    access_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

app.get('/.well-known/jwks.json', async (c) => {
  const key = await getJwtKey(c.env);
  const jwk = await exportJWK(key);
  jwk.kid = c.env.AUTH_JWT_KID ?? 'auth-1';
  jwk.use = 'sig';
  jwk.alg = 'RS256';
  delete (jwk as { d?: string }).d;
  delete (jwk as { p?: string }).p;
  delete (jwk as { q?: string }).q;
  delete (jwk as { dp?: string }).dp;
  delete (jwk as { dq?: string }).dq;
  delete (jwk as { qi?: string }).qi;

  return c.json({ keys: [jwk] });
});

app.get('/auth/authorize', async (c) => {
  const state = c.req.query('state');
  const codeChallenge = c.req.query('code_challenge');
  const appRedirect = c.req.query('redirect_uri');

  if (!state || !codeChallenge || !appRedirect) {
    return c.json({ error: 'Missing state, code_challenge, or redirect_uri' }, 400);
  }

  await c.env.AUTH_DB.prepare(
    `
    DELETE FROM auth_sessions WHERE id = ?
    `.trim()
  )
    .bind(state)
    .run();

  await c.env.AUTH_DB.prepare(
    `
    INSERT INTO auth_sessions (id, app_redirect_uri, code_challenge)
    VALUES (?, ?, ?)
    `.trim()
  )
    .bind(state, appRedirect, codeChallenge)
    .run();

  const authorizeUrl = new URL(`${c.env.AUTH_OIDC_ISSUER.replace(/\/+$/, '')}/authorization`);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', c.env.AUTH_OIDC_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', c.env.AUTH_OIDC_REDIRECT_URL);
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  return c.redirect(authorizeUrl.toString(), 302);
});

app.get('/auth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400);
  }

  const session = await c.env.AUTH_DB.prepare(
    `
    SELECT app_redirect_uri FROM auth_sessions WHERE id = ?
    `.trim()
  )
    .bind(state)
    .first<{ app_redirect_uri: string }>();

  if (!session?.app_redirect_uri) {
    return c.json({ error: 'Invalid state' }, 400);
  }

  await c.env.AUTH_DB.prepare(
    `
    DELETE FROM auth_sessions WHERE id = ?
    `.trim()
  )
    .bind(state)
    .run();

  const redirectUrl = new URL(session.app_redirect_uri);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);

  return c.redirect(redirectUrl.toString(), 302);
});

app.post('/auth/exchange', async (c) => {
  const body = await c.req.json<{
    code?: string;
    code_verifier?: string;
  }>();

  if (!body?.code || !body?.code_verifier) {
    return c.json({ error: 'Missing code or code_verifier' }, 400);
  }

  const tokens = await exchangeAccessCode(c.env, body.code, body.code_verifier);

  const jwks = createRemoteJWKSet(new URL(`${c.env.AUTH_OIDC_ISSUER.replace(/\/+$/, '')}/jwks`));

  const verified = await jwtVerify(tokens.id_token, jwks, {
    issuer: c.env.AUTH_OIDC_ISSUER,
    audience: c.env.AUTH_OIDC_CLIENT_ID,
  });

  const claims = verified.payload as {
    sub: string;
    email?: string;
    name?: string;
    roles?: string[];
    tenant_id?: string;
  };

  const tenantId = claims.tenant_id ?? c.env.AUTH_DEFAULT_TENANT_ID ?? 'tenant_default';
  const role = claims.roles?.[0] ?? 'technician';
  await upsertUser(c.env, {
    id: claims.sub,
    email: claims.email ?? 'unknown@example.com',
    name: claims.name ?? 'Unknown User',
    role,
    tenantId,
  });
  const userRow = await getUserById(c.env, claims.sub);
  const user = {
    id: claims.sub,
    email: userRow?.email ?? claims.email ?? 'unknown@example.com',
    name: userRow?.name ?? claims.name ?? 'Unknown User',
    role: userRow?.role ?? role,
    tenantId: userRow?.tenant_id ?? tenantId,
  };

  const accessToken = await issueAccessToken(c.env, user);
  const refresh = await issueRefreshToken(c.env, user);

  return c.json(
    {
      access_token: accessToken,
      expires_in: parseNumber(c.env.AUTH_ACCESS_TOKEN_TTL_MIN, 15) * 60,
      refresh_token: refresh.token,
      refresh_expires_at: refresh.expiresAt,
      user,
    },
    200,
    jsonHeaders
  );
});

app.post('/auth/refresh', async (c) => {
  const body = await c.req.json<{ refresh_token?: string }>();
  if (!body?.refresh_token) {
    return c.json({ error: 'Missing refresh_token' }, 400);
  }

  const tokenHash = await sha256(body.refresh_token);
  const row = await c.env.AUTH_DB.prepare(
    `
    SELECT id, user_id, tenant_id, expires_at, revoked_at
    FROM refresh_tokens
    WHERE token_hash = ?
    `.trim()
  )
    .bind(tokenHash)
    .first<{
      id: string;
      user_id: string;
      tenant_id: string;
      expires_at: string;
      revoked_at: string | null;
    }>();

  if (!row || row.revoked_at) {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }

  if (new Date(row.expires_at) < new Date()) {
    return c.json({ error: 'Refresh token expired' }, 401);
  }

  await c.env.AUTH_DB.prepare(
    `
    UPDATE refresh_tokens SET revoked_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    WHERE id = ?
    `.trim()
  )
    .bind(row.id)
    .run();

  const userRow = await getUserById(c.env, row.user_id);

  if (!userRow) {
    return c.json({ error: 'User not found' }, 404);
  }

  const user: AuthUser = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role,
    tenantId: userRow.tenant_id,
  };

  const accessToken = await issueAccessToken(c.env, user);
  const refresh = await issueRefreshToken(c.env, user);

  return c.json(
    {
      access_token: accessToken,
      expires_in: parseNumber(c.env.AUTH_ACCESS_TOKEN_TTL_MIN, 15) * 60,
      refresh_token: refresh.token,
      refresh_expires_at: refresh.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    },
    200,
    jsonHeaders
  );
});

app.post('/auth/logout', async (c) => {
  const body = await c.req.json<{ refresh_token?: string }>();
  if (!body?.refresh_token) {
    return c.json({ error: 'Missing refresh_token' }, 400);
  }

  const tokenHash = await sha256(body.refresh_token);
  await c.env.AUTH_DB.prepare(
    `
    UPDATE refresh_tokens
    SET revoked_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    WHERE token_hash = ?
    `.trim()
  )
    .bind(tokenHash)
    .run();

  return c.json({ success: true });
});

export default app;
