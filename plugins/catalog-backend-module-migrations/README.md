# @district09/backstage-plugin-catalog-backend-module-migrations

A catalog backend module that teaches Backstage's software catalog how to ingest and process the custom `Migration` entity kind.

## What it does

This module registers a `MigrationKindProcessor` with the catalog processing pipeline. The processor:

1. **Validates** `Migration` entities against the `MigrationEntityV1` JSON schema.
2. **Emits ownership relations** — an `ownedBy` relation to the group or user specified in `spec.owner`, and the corresponding `ownerOf` relation back from the owner.

Without this module, the catalog will reject `Migration` entities as unknown kinds.

## Installation

```bash
# From your root directory
yarn --cwd packages/backend add @district09/backstage-plugin-catalog-backend-module-migrations
```

Add the module to your backend:

```ts
// packages/backend/src/index.ts
const backend = createBackend();
// ...
backend.add(
  import('@district09/backstage-plugin-catalog-backend-module-migrations'),
);
```

## Allow `Migration` entities in the catalog

Add `Migration` to the allowed kinds in your `app-config.yaml`:

```yaml
catalog:
  rules:
    - allow: [Component, System, API, Resource, Location, Migration]
```

## Adding `Migration` entities to the catalog

Register your `Migration` entity files as catalog locations:

```yaml
catalog:
  locations:
    - type: file
      target: ../../migrations/my-migration.yaml
      rules:
        - allow: [Migration]
    # Or from a URL:
    - type: url
      target: https://github.com/my-org/my-repo/blob/main/catalog/migrations.yaml
      rules:
        - allow: [Migration]
```
