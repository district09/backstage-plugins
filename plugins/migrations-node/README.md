# @district09/backstage-plugin-migrations-node

Node.js library for the migrations plugin. This package provides the base classes, interfaces, and extension points needed to implement custom migration checkers.

## Installation

```bash
yarn --cwd packages/backend add @district09/backstage-plugin-migrations-node
```

## Writing a custom checker

A **checker** is a service that runs a specific check against catalog entities and reports a boolean result (pass/fail). Each checker is identified by a unique `id` string that matches the `checkId` referenced in `Migration` entity specs.

### Extend `BaseMigrationChecker`

The easiest way to implement a checker is to extend `BaseMigrationChecker`:

```ts
import {
  BaseMigrationChecker,
  MigrationCheckResult,
} from '@district09/backstage-plugin-migrations-node';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { Entity } from '@backstage/catalog-model';

export class Python3Checker extends BaseMigrationChecker {
  id = 'python3-checker';
  description = 'Checks whether a component uses Python 3';

  async runCheck(
    entity: Entity,
    _migration: MigrationEntityV1,
  ): Promise<MigrationCheckResult> {
    const isPython3 =
      entity.metadata.annotations?.['example.com/python-version'] === '3';
    return {
      result: isPython3,
      message: isPython3
        ? undefined
        : `Component is on Python ${
            entity.metadata.annotations?.['example.com/python-version'] ??
            'unknown'
          } — upgrade to Python 3 is required.`,
    };
  }
}
```

`BaseMigrationChecker` automatically:

- Queries the catalog for all entities matched by the `Migration`'s `entityFilter`
- Calls `runCheck` for each matched entity
- Persists the results to the database

### Implement `MigrationChecker` directly

For full control, implement the `MigrationChecker` interface directly:

```ts
import {
  MigrationChecker,
  CheckResultsDbEntity,
} from '@district09/backstage-plugin-migrations-node';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';

export class MyChecker implements MigrationChecker {
  id = 'my-checker';
  description = 'My custom checker';

  async runCheckForAllRelatedEntities(
    migration: MigrationEntityV1,
  ): Promise<CheckResultsDbEntity[]> {
    // Custom logic here
    return [];
  }
}
```

## Registering a checker

Checkers are registered via the `migrationCheckRunnerExtensionPoint` in a backend module:

```ts
import { createBackendModule } from '@backstage/backend-plugin-api';
import { migrationCheckRunnerExtensionPoint } from '@district09/backstage-plugin-migrations-node';
import { coreServices, catalogServiceRef } from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { Python3Checker } from './Python3Checker';

export const migrationsModulePython3Checker = createBackendModule({
  pluginId: 'migrations',
  moduleId: 'python3-checker',
  register(reg) {
    reg.registerInit({
      deps: {
        checkers: migrationCheckRunnerExtensionPoint,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
        logger: coreServices.logger,
      },
      async init({ checkers, catalog, auth, logger }) {
        checkers.addChecker(new Python3Checker({ catalog, auth, logger }));
      },
    });
  },
});
```

Then add the module to your backend:

```ts
// packages/backend/src/index.ts
backend.add(import('./modules/migrationsModulePython3Checker'));
```

## API reference

### `BaseMigrationChecker`

Abstract base class. Subclasses must implement:

| Member                        | Type                            | Description                                                                                   |
| ----------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `id`                          | `string`                        | Unique identifier matching the `checkId` in Migration specs                                   |
| `description`                 | `string`                        | Human-readable description of the check                                                       |
| `runCheck(entity, migration)` | `Promise<MigrationCheckResult>` | Runs the check for a single entity. Return `message` to explain why a check passed or failed. |

### `migrationCheckRunnerExtensionPoint`

Extension point used to register checkers with the migrations backend plugin. Use `addChecker(checker)` to register.

### `CheckerStoreService`

Internal service interface for storing and retrieving registered checkers. Available via `checkerStoreServiceRef`.
