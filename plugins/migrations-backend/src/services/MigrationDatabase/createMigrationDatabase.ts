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
import { CheckResultsDbEntity } from '@district09/backstage-plugin-migrations-node';

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
  };
}
