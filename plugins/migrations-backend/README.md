# @district09/backstage-plugin-migrations-backend

Backend plugin that powers the migrations feature. It runs scheduled checks against catalog entities and exposes a REST API consumed by the frontend plugin.

## What it does

- Runs all registered checkers against their corresponding `Migration` entities on a configurable schedule (default: every 30 minutes).
- Stores check results in a database table (`migration_check_results`).
- Exposes REST endpoints to query results and trigger immediate re-checks.
- Supports the `migrationCheckRunnerExtensionPoint` to allow third-party modules to register custom checkers.

## Installation

```bash
# From your root directory
yarn --cwd packages/backend add @district09/backstage-plugin-migrations-backend
```

Add the plugin to your backend:

```ts
// packages/backend/src/index.ts
const backend = createBackend();
// ...
backend.add(import('@district09/backstage-plugin-migrations-backend'));
```

> **Note:** You also need the catalog module and at least one checker module. See the [catalog module](../catalog-backend-module-migrations/README.md) and [migrations-node](../migrations-node/README.md) docs.

## Configuration

The check schedule can be configured in `app-config.yaml`. If omitted, checks run every 30 minutes with a 10-minute timeout.

```yaml
migrations:
  schedule:
    frequency:
      minutes: 30 # How often to run all migration checks
    timeout:
      minutes: 10 # Maximum run time per check cycle
    scope: global # Run once across all backend instances
```

Any [Backstage scheduler task schedule definition](https://backstage.io/docs/reference/backend-plugin-api.schedulerservicetaskscheduledefinition) fields are supported (e.g. `cron` instead of `frequency`).

## REST API

All endpoints are mounted under `/api/migrations`.

### `POST /api/migrations/refresh/:namespace/:kind/:name`

Triggers an immediate check run for the specified `Migration` entity, outside the regular schedule.

**Parameters (path):**

| Name        | Description                                        |
| ----------- | -------------------------------------------------- |
| `namespace` | Namespace of the Migration entity (e.g. `default`) |
| `kind`      | Must be `Migration`                                |
| `name`      | Name of the Migration entity                       |

**Response:** `202 Accepted` on success.

---

### `GET /api/migrations/results/migration/:namespace/:kind/:name`

Returns paginated check results for all components tracked by the given `Migration` entity.

**Parameters (path):**

| Name        | Description                       |
| ----------- | --------------------------------- |
| `namespace` | Namespace of the Migration entity |
| `kind`      | Must be `Migration`               |
| `name`      | Name of the Migration entity      |

**Query parameters:**

| Name       | Default | Description                                                           |
| ---------- | ------- | --------------------------------------------------------------------- |
| `offset`   | `0`     | Pagination offset                                                     |
| `pageSize` | `10`    | Number of results per page. Set to `0` to return all.                 |
| `search`   | —       | Filter by component name                                              |
| `filter`   | —       | Set to `owned` to only return components owned by the requesting user |

**Response:**

```json
{
  "checks": [
    {
      "id": "python3-checker",
      "description": "Checks whether a component uses Python 3"
    }
  ],
  "components": [
    {
      "id": "component:default/my-service",
      "results": [
        {
          "checkId": "python3-checker",
          "result": true,
          "checked_at": "2025-08-15T10:00:00.000Z"
        }
      ]
    }
  ],
  "totalCount": 42
}
```

---

### `GET /api/migrations/results/component/:namespace/:kind/:name`

Returns all migration check results for a specific component, across all migrations.

**Parameters (path):**

| Name        | Description                              |
| ----------- | ---------------------------------------- |
| `namespace` | Namespace of the component               |
| `kind`      | Kind of the component (e.g. `Component`) |
| `name`      | Name of the component                    |

**Response:**

```json
[
  {
    "checkId": "python3-checker",
    "migrationReference": "migration:default/python3-migration",
    "result": false,
    "checked_at": "2025-08-15T10:00:00.000Z"
  }
]
```

## Development

Start the backend plugin in standalone mode:

```bash
yarn --cwd plugins/migrations-backend start
```

To run the full app including the frontend, run `yarn start` from the repo root.
