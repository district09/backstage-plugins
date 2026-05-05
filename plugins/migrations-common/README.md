# @district09/backstage-plugin-migrations-common

Shared types, interfaces, and validators used by both the frontend and backend of the migrations plugin suite. This is a library package — install it as a dependency when building a custom checker or integrating with the migrations plugin.

## Contents

### `MigrationEntityV1`

TypeScript interface describing the custom `Migration` catalog entity:

```ts
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
```

### `migrationEntityV1Validator`

A Backstage `KindValidator` for `Migration` entities. Used by the catalog processor to validate entities at ingestion time.

### `isMigrationEntityV1`

A type-guard helper:

```ts
import { isMigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';

if (isMigrationEntityV1(entity)) {
  // entity is now typed as MigrationEntityV1
}
```

### Response types

| Type                             | Description                                          |
| -------------------------------- | ---------------------------------------------------- |
| `ComponentMigrationResult`       | The result of a single check for a single component  |
| `SingleComponentMigrationResult` | Same as above, enriched with a `migrationReference`  |
| `MigrationResultsResponse`       | Paginated API response shape returned by the backend |

## The `Migration` entity

See the [`Migration` entity documentation](../../docs/migration-entity.md) for the full spec reference.

Quick example:

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
