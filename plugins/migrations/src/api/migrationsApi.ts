import {
  ApiBlueprint,
  createApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/frontend-plugin-api';
import { MigrationClient } from './client.ts';
import { MigrationsApi } from './types.ts';

export const migrationsApiRef = createApiRef<MigrationsApi>().with({
  id: 'plugin.migrations.service',
  pluginId: 'migrations',
});

export const migrationsApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: migrationsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ discoveryApi, fetchApi }) {
        return new MigrationClient(discoveryApi, fetchApi);
      },
    }),
});
