# [District09 Backstage Plugins](https://github.com/district09/backstage-plugins)

A suite of Backstage plugins for tracking **migrations** across catalog components — e.g. "are all Python services migrated to Python 3?" or "do all components have a valid title?".

## Plugins

| Package                                                                                                         | Role            | Description                                                          |
| --------------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------------------------------------- |
| [`@district09/backstage-plugin-migrations`](./plugins/migrations)                                               | Frontend plugin | Migrations page, entity tabs and cards                               |
| [`@district09/backstage-plugin-migrations-backend`](./plugins/migrations-backend)                               | Backend plugin  | Check scheduler, result storage, REST API                            |
| [`@district09/backstage-plugin-catalog-backend-module-migrations`](./plugins/catalog-backend-module-migrations) | Catalog module  | Teaches the catalog how to ingest `Migration` entities               |
| [`@district09/backstage-plugin-migrations-common`](./plugins/migrations-common)                                 | Shared library  | Types, interfaces and validators shared between frontend and backend |
| [`@district09/backstage-plugin-migrations-node`](./plugins/migrations-node)                                     | Node library    | Base classes and extension points for building custom checkers       |

## The `Migration` entity

Migrations are modelled as a custom Backstage catalog entity kind (`Migration`). Each `Migration` entity defines:

- Which catalog entities to check (`entityFilter`)
- Which checks to run (`checks`)
- Who owns the migration (`owner`)
- When it is due (`dueDate`)
- Whether it is mandatory

```yaml
apiVersion: backstage.district09.gent/v1
kind: Migration
metadata:
  name: python3-migration
  title: Python 3 Migration
  description: Ensure all Python services have migrated to Python 3.
spec:
  type: service
  owner: team-platform
  dueDate: 2025-12-31
  mandatory: true
  entityFilter:
    kind: Component
    spec.type: service
  checks:
    - checkId: python3-checker
```

See the individual plugin READMEs for full field descriptions and configuration options.

## Quick start (local sample app)

```sh
yarn install
yarn start
```

## Full installation

For a full installation in your own Backstage instance, follow these steps in order:

1. Install the **catalog module** so `Migration` entities are accepted by the catalog:
   → [`catalog-backend-module-migrations`](./plugins/catalog-backend-module-migrations/README.md)

2. Install the **backend plugin** to run checks and serve the API:
   → [`migrations-backend`](./plugins/migrations-backend/README.md)

3. Install the **frontend plugin** to display results in the UI:
   → [`migrations`](./plugins/migrations/README.md)

4. Build one or more **checker modules** using the node library:
   → [`migrations-node`](./plugins/migrations-node/README.md)
