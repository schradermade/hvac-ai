# Copilot Production MVP Checklist

This document tracks the minimum set of work required to run the Copilot end-to-end for real tenants, users, and jobs.

## Cloudflare-First Principle

Prefer Cloudflare-native services whenever feasible (Workers, D1, KV, Vectorize, Access, Turnstile, Queues, R2, Analytics/Logs). Only introduce third-party services when a Cloudflare-native option cannot meet requirements.

## 1) Auth + tenancy

- Add real auth (JWT/session) and derive tenant/user identity server-side.
- Replace header-only `x-tenant-id` with auth-derived tenant.
- Enforce tenant scoping in every query.

### Cloudflare-native auth architecture

- **Cloudflare Access** protects the Worker route (Zero Trust).
- **JWT validation** in the Worker (Access JWT in `Cf-Access-Jwt-Assertion`).
- **User/Tenant mapping** stored in D1 (link Access identity → tenant/user).
- **Session caching** in KV (optional) to reduce D1 lookups.
- **Turnstile** for public-facing entry points (if required).

**Flow:**

1. User authenticates via Cloudflare Access.
2. Access injects JWT into request headers.
3. Worker validates JWT and resolves user + tenant from D1 (or KV cache).
4. Routes read `tenantId`/`userId` from context and enforce access.

**Required Worker config:**

- `CF_ACCESS_AUD` (Access application audience)
- `CF_ACCESS_JWKS_URL` (Access JWKS URL)
- `CF_ACCESS_ISSUER` (optional, Access issuer URL)
- `ALLOW_DEV_AUTH=1` (dev-only fallback for local testing)

**Dev-only headers (when `ALLOW_DEV_AUTH=1`):**

- `x-tenant-id`
- `x-user-id`
- `x-user-role` (optional, defaults to `technician`)

**Service tokens:**

- Access service-token JWTs omit `sub`. Use `common_name` as the subject.
- Map service tokens in `access_identities.subject` using the `common_name` value.

## 2) Data ingestion + sync

- Create ingestion pipeline to write jobs/clients/notes/events into D1.
- Add reindex triggers whenever job evidence changes.
- Verify indexing coverage for notes, job events, properties, and clients.

## 3) Permissions + access control

- Enforce job visibility rules by role (dispatcher/admin/tech).
- Restrict job context + evidence to authorized users.
- Add audit logging for access and reindex requests.

## 4) Copilot reliability

- Add input validation + schema enforcement for chat and context routes.
- Add guardrails for no-data responses and uncertainty handling.
- Standardize citations and response shape.

## 5) Observability + cost controls

- Add structured logging and error reporting.
- Implement rate limits per tenant/user.
- Track OpenAI and Vectorize usage per tenant.

## 6) Deployment hardening

- Environment-specific configuration and secrets.
- CI pipeline for lint/test/deploy.
- Health checks and release verification.
