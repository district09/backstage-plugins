# @district09/backstage-plugin-migrations

Frontend plugin for the migrations feature. Built for Backstage's [new frontend system](https://backstage.io/docs/frontend-system/architecture/index).

## What it does

- Adds a **Migrations page** (`/migrations`) that lists all `Migration` entities in the catalog, filterable by owner and tags.
- Adds a **"Migrations" tab** to `Component` and `API` entity pages, showing all check results for that entity across all migrations it participates in.
- Adds a **results table card** to `Migration` entity pages, showing per-component check results with pass/fail indicators and pagination.
- Adds a **progress summary card** to `Migration` entity pages.
- Adds a **refresh icon link** to `Migration` entity pages to trigger an immediate check run.

## Installation

```bash
# From your root directory
yarn --cwd packages/app add @district09/backstage-plugin-migrations
```

Add the plugin to your frontend app:

```ts
// packages/app/src/App.tsx  (new frontend system)
import migrationsPlugin from '@district09/backstage-plugin-migrations';

export default createApp({
  features: [
    // ...
    migrationsPlugin,
  ],
});
```

Or you can use the autodiscovery mechanism provided by backstage NFS.

## Extensions

All extensions are part of the plugin and enabled by default. They can be individually disabled via `app-config.yaml` if needed.

| Extension ID                                              | Description                                             |
| --------------------------------------------------------- | ------------------------------------------------------- |
| `page:migrations`                                         | The `/migrations` catalog page                          |
| `entity-content:migrations/migrations`                    | "Migrations" tab on `Component` and `API` entity pages  |
| `entity-card:migrations/migration-entity-results-table`   | Per-component results table on `Migration` entity pages |
| `entity-card:migrations/migration-progress-content`       | Progress summary on `Migration` entity pages            |
| `entity-icon-link:migrations/migrations-entity-icon-link` | Refresh icon link on `Migration` entity pages           |

Example — disable the progress card:

```yaml
# app-config.yaml
app:
  extensions:
    - entity-card:migrations/migration-progress-content: false
```

## Development

Start the frontend plugin in standalone mode:

```bash
yarn --cwd plugins/migrations start
```

To run the full app including the backend, run `yarn start` from the repo root.
