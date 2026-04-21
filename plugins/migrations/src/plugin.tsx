import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { rootRouteRef } from './routes.ts';
import { migrationsApi } from './api';
import BuildIcon from '@material-ui/icons/Build';
import { compatWrapper } from '@backstage/core-compat-api';
import {
  EntityCardBlueprint,
  EntityContentBlueprint,
  EntityIconLinkBlueprint,
} from '@backstage/plugin-catalog-react/alpha';
import { isMigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { useMigrationEntityIconLinkProps } from './hooks/useMigrationEntityIconLinkProps.tsx';
import { Entity } from '@backstage/catalog-model';

export const migrationsPage = PageBlueprint.make({
  params: {
    path: '/migrations',
    routeRef: rootRouteRef,
    icon: <BuildIcon />,
    title: 'Migrations',
    loader: () =>
      import('./components/MigrationsPage').then(m =>
        compatWrapper(<m.MigrationsPage />),
      ),
  },
});

// export const migrationsPageNavItem = NavItemBlueprint.make({
//   params: {
//     routeRef: rootRouteRef,
//     icon: BuildIcon,
//     title: 'Migrations',
//   },
// });

export const migrationRefreshLink = EntityIconLinkBlueprint.make({
  name: 'migrations-entity-icon-link',
  params: {
    // only show for MigrationEntityV1
    filter: isMigrationEntityV1,
    useProps: useMigrationEntityIconLinkProps,
  },
});

export const entityMigrationContent = EntityContentBlueprint.make({
  params: {
    path: '/migrations',
    title: 'Migrations',
    filter: (entity: Entity) => ['Component', 'Api'].includes(entity.kind),
    // TODO: figure out a way to re-enable this
    //  (entity.relations?.filter(e => e.type === RELATION_MIGRATED_BY)?.length ??
    //   0) > 0,
    async loader() {
      return import('./components/EntityMigrationContent').then(m => (
        <m.EntityMigrationContent />
      ));
    },
  },
});

// export const migrationTableCard = EntityCardBlueprint.make({
//   name: 'migration-table',
//   params: {
//     filter: isMigrationEntityV1,
//     type: 'content',
//     loader: async () =>
//       import('./components/cards/MigrationProgressTable.tsx').then(m => (
//         <m.MigrationProgressTable />
//       )),
//   },
// });

export const migrationEntityResultsTable = EntityCardBlueprint.make({
  name: 'migration-entity-results-table',
  params: {
    filter: isMigrationEntityV1,
    type: 'content',
    loader: async () =>
      import('./components/MigrationEntityResultsTable').then(m => (
        <m.MigrationEntityResultsTable />
      )),
  },
});

export const migrationProgressContent = EntityCardBlueprint.make({
  name: 'migration-progress-content',
  params: {
    filter: isMigrationEntityV1,
    type: 'content',
    loader: async () =>
      import('./components/cards/MigrationProgressContent.tsx').then(m => (
        <m.MigrationProgressContent />
      )),
  },
});

// export const migrationEntityProgressCard = EntityCardBlueprint.make({
//   name: 'migration-progress-card',
//   params: {
//     filter: isMigrationEntityV1,
//     type: 'content',
//     loader: async () =>
//       import('./components/cards/MigrationProgressCard.tsx').then(m => (
//         <m.MigrationProgressCard />
//       )),
//   },
// });
//
// export const migrationEntityRunnerSummaryCard = EntityCardBlueprint.make({
//   name: 'migration-runner-summary-card',
//   params: {
//     filter: isMigrationEntityV1,
//     type: 'content',
//     loader: async () =>
//       import('./components/cards/MigrationRunnersSummary.tsx').then(m => (
//         <m.MigrationRunnersSummary />
//       )),
//   },
// });

export const migrationsPlugin = createFrontendPlugin({
  pluginId: 'migrations',
  extensions: [
    migrationsPage,
    migrationsApi,
    // migrationsPageNavItem,
    migrationRefreshLink,
    entityMigrationContent,
    migrationProgressContent,
    // migrationTableCard,
    migrationEntityResultsTable,
  ],
  routes: {
    root: rootRouteRef,
  },
});
