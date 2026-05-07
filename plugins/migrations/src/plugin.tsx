import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { rootRouteRef } from './routes.ts';
import { migrationsApi } from './api';
import { RiToolsLine } from '@remixicon/react';
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
    loader: () =>
      import('./components/MigrationsPage').then(m => <m.MigrationsPage />),
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
    async loader() {
      return import('./components/EntityContentMigration').then(m => (
        <m.EntityContentMigration />
      ));
    },
  },
});

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

export const migrationsPlugin = createFrontendPlugin({
  pluginId: 'migrations',
  title: 'Migrations',
  icon: <RiToolsLine />,
  info: {
    packageJson: () => import('../package.json'),
  },
  extensions: [
    migrationsPage,
    migrationsApi,
    migrationRefreshLink,
    entityMigrationContent,
    migrationProgressContent,
    migrationEntityResultsTable,
  ],
  routes: {
    root: rootRouteRef,
  },
});
