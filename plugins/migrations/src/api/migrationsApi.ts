import { ApiBlueprint } from '@backstage/frontend-plugin-api';
import {
  createApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { MigrationClient } from './client.ts';
import { MigrationsApi } from './types.ts';

export const migrationsApiRef = createApiRef<MigrationsApi>({
  id: 'plugin.migrations.service',
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
