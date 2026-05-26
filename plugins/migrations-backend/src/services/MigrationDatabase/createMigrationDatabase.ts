import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  ServiceFactory,
  ServiceRef,
} from '@backstage/backend-plugin-api';
import { MigrationDatabase } from './types.ts';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  CheckResultsDbEntity,
  MigrationRunResultDbEntity,
} from '@district09/backstage-plugin-migrations-node';

export const migrationDatabaseServiceRef = createServiceRef<MigrationDatabase>({
  id: 'migrations.migrationDatabase',
  async defaultFactory(
    service: ServiceRef<MigrationDatabase, 'plugin'>,
  ): Promise<ServiceFactory> {
    return createServiceFactory({
      service,
      deps: {
        database: coreServices.database,
      },
      async factory({ database }) {
        return await createMigrationDatabase({ database });
      },
    });
  },
});

export async function createMigrationDatabase({
  database,
}: {
  database: typeof coreServices.database.T;
}): Promise<MigrationDatabase> {
  const client = await database.getClient();
  return {
    async retrieveResultsFor({
      migrationReference,
    }: {
      migrationReference: CompoundEntityRef;
    }): Promise<Array<CheckResultsDbEntity>> {
      return (await client('migration_check_results').where(
        'migrationReference',
        stringifyEntityRef(migrationReference),
      )) as Array<CheckResultsDbEntity>;
    },
    async retrieveResultsForComponent(entity: CompoundEntityRef) {
      return (await client('migration_check_results').where(
        'componentReference',
        stringifyEntityRef(entity),
      )) as Array<CheckResultsDbEntity>;
    },
    async storeMigrationCheck(input: {
      migrationReference: CompoundEntityRef;
      results: Array<CheckResultsDbEntity>;
    }): Promise<void> {
      const refStr = stringifyEntityRef(input.migrationReference);
      await client.transaction(async tx => {
        // clear old records to preserve table size
        await tx
          .table('migration_check_results')
          .where('migrationReference', refStr)
          .del();
        await tx.batchInsert<CheckResultsDbEntity>(
          'migration_check_results',
          input.results,
          50,
        );
      });
    },
    async storeEntityCheckResults(input: {
      migrationReference: CompoundEntityRef;
      componentReference: CompoundEntityRef;
      results: Array<CheckResultsDbEntity>;
    }): Promise<void> {
      const migrationRefStr = stringifyEntityRef(input.migrationReference);
      const componentRefStr = stringifyEntityRef(input.componentReference);
      await client.transaction(async tx => {
        await tx
          .table('migration_check_results')
          .where('migrationReference', migrationRefStr)
          .where('componentReference', componentRefStr)
          .del();
        if (input.results.length > 0) {
          await tx.batchInsert<CheckResultsDbEntity>(
            'migration_check_results',
            input.results,
            50,
          );
        }
      });
    },
    async storeCheckResult(result) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      await client.transaction(async tx => {
        await tx
          .table('migration_check_runs')
          .where('migrationReference', result.migrationReference)
          .where('started_at', '<', cutoff)
          .del();
        await tx.table('migration_check_runs').insert(result);
      });
    },
    async getResultHistory(migration) {
      return (await client
        .table('migration_check_runs')
        .where('migrationReference', stringifyEntityRef(migration))
        .orderBy('started_at', 'asc')) as Array<MigrationRunResultDbEntity>;
    },
  };
}
