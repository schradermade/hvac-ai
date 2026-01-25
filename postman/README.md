# Postman

This folder contains the Postman collection for the HVACOps Copilot API.

## Import

1. In Postman, click `Import`.
2. Select `postman/Copilot_API.postman_collection.json`.

## Environments

This repo includes a sanitized local environment export:

- `postman/Copilot_API.local.postman_environment.json`

Create additional environments in Postman and set:

- `baseUrl`
- `tenantId`
- `userId`
- (optional) `accessClientId`
- (optional) `accessClientSecret`

## Changelog

See `postman/CHANGELOG.md` for updates to the collection and environments.

## CI

GitHub Actions runs the collections via Newman.

Staging E2E (`postman.yml`):

- `POSTMAN_BASE_URL_STAGING` (required)
- `POSTMAN_TENANT_ID_STAGING` (optional)
- `POSTMAN_USER_ID_STAGING` (optional)

Production smoke (`postman-smoke.yml`):

- `POSTMAN_BASE_URL_PROD` (required)
- `POSTMAN_JOB_ID_PROD` (required)
- `POSTMAN_TENANT_ID_PROD` (optional)
- `POSTMAN_USER_ID_PROD` (optional)
