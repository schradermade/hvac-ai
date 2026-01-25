# Auth Architecture (Enterprise)

This project uses a dedicated Auth Worker that brokers Cloudflare Access OIDC and issues
first‑party JWTs for mobile clients.

## Components

- Auth Worker: `src/auth/worker.ts`
- Auth D1 schema: `db/auth/0001_auth.sql`
- Worker config: `wrangler.auth.toml`

## Setup

1. Create the auth D1:

```bash
wrangler d1 create hvacops-auth
```

2. Apply schema:

```bash
wrangler d1 execute hvacops-auth --file db/auth/0001_auth.sql
```

3. Configure Cloudflare Access OIDC app:

- Set redirect URL to `https://auth.hvacops.com/auth/callback`.
- Copy client ID + secret into Worker secrets.

4. Set Worker secrets:

```bash
wrangler secret put AUTH_OIDC_CLIENT_ID
wrangler secret put AUTH_OIDC_CLIENT_SECRET
wrangler secret put AUTH_JWT_PRIVATE_KEY
```

5. Deploy the auth worker and update routes.

## Flow (Mobile)

1. App opens `/auth/authorize` with PKCE (state + code_challenge).
2. Auth Worker redirects to Cloudflare Access OIDC login.
3. Access redirects to `/auth/callback` with `code`.
4. App exchanges `code` + `code_verifier` via `/auth/exchange`.
5. Auth Worker returns access JWT + rotating refresh token.
6. API Worker validates JWT via `AUTH_JWKS_URL`.

## Required Auth Worker Env Vars

- `AUTH_OIDC_ISSUER`
- `AUTH_OIDC_CLIENT_ID`
- `AUTH_OIDC_CLIENT_SECRET`
- `AUTH_OIDC_REDIRECT_URL`
- `AUTH_JWT_PRIVATE_KEY`
- `AUTH_JWT_ISSUER`
- `AUTH_JWT_AUDIENCE`
- `AUTH_JWKS_URL` (served by auth worker)
- `AUTH_DEFAULT_TENANT_ID` (fallback)
- `AUTH_ACCESS_TOKEN_TTL_MIN` (optional, default 15)
- `AUTH_REFRESH_TOKEN_TTL_DAYS` (optional, default 30)

## API Worker Env Vars

- `AUTH_JWKS_URL`
- `AUTH_JWT_ISSUER`
- `AUTH_JWT_AUDIENCE`

## App Env Vars

- `EXPO_PUBLIC_AUTH_URL` (e.g., `https://auth.hvacops.com`)

## App Notes

- `app.json` defines the `hvacops://` scheme for OIDC redirects.
- The login screen uses PKCE via `expo-auth-session`.

## Notes

- Do not ship Cloudflare Access client secrets in mobile apps.
- Keep Access protections on admin routes only.
- Use rotating refresh tokens (already supported in Auth Worker).
