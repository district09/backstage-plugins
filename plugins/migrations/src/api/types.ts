import {
  MigrationEntityV1,
  MigrationResultsResponse,
  SingleComponentMigrationResult,
} from '@district09/backstage-plugin-migrations-common';
import { CompoundEntityRef } from '@backstage/catalog-model';

export interface MigrationsApi {
  getMigrationResults(
    migration: MigrationEntityV1,
    params: {
      offset?: number;
      pageSize?: number;
      search?: string;
      signal?: AbortSignal;
      filter?: string;
    },
  ): Promise<MigrationResultsResponse>;

  getMigrationResultsByRef(
    migrationRef: CompoundEntityRef,
    params: {
      offset?: number;
      pageSize?: number;
      search?: string;
      signal?: AbortSignal;
    },
  ): Promise<MigrationResultsResponse>;

  getComponentResults(
    entity: CompoundEntityRef,
  ): Promise<SingleComponentMigrationResult[]>;

  refreshMigration(migration: MigrationEntityV1): Promise<{ success: boolean }>;
}
