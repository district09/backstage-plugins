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
  ComponentRunResultDbEntity,
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
    async storeCheckResult(input: {
      run: MigrationRunResultDbEntity;
      components: Array<
        Pick<
          ComponentRunResultDbEntity,
          'componentReference' | 'passed' | 'partial'
        >
      >;
    }): Promise<void> {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      await client.transaction(async tx => {
        // Prune runs older than 30 days (cascade deletes component rows too)
        await tx
          .table('migration_check_runs')
          .where('migrationReference', input.run.migrationReference)
          .where('started_at', '<', cutoff)
          .del();
        const [{ id: runId }] = await tx
          .table('migration_check_runs')
          .insert(input.run)
          .returning('id');
        if (input.components.length > 0) {
          const componentRows: ComponentRunResultDbEntity[] =
            input.components.map(c => ({
              run_id: runId,
              migrationReference: input.run.migrationReference,
              componentReference: c.componentReference,
              passed: c.passed,
              partial: c.partial,
            }));
          await tx.batchInsert(
            'migration_component_run_results',
            componentRows,
            50,
          );
        }
      });
    },
    async getResultHistory(
      migration: CompoundEntityRef,
      params?: { componentRefs?: string[] },
    ): Promise<Array<MigrationRunResultDbEntity>> {
      const migrationRef = stringifyEntityRef(migration);

      if (params?.componentRefs && params.componentRefs.length > 0) {
        // Recompute per-run aggregates for the requested component subset
        const rows = await client
          .table('migration_check_runs as runs')
          .join(
            'migration_component_run_results as comp',
            'runs.id',
            'comp.run_id',
          )
          .where('runs.migrationReference', migrationRef)
          .whereIn('comp.componentReference', params.componentRefs)
          .groupBy('runs.id', 'runs.migrationReference', 'runs.started_at')
          .orderBy('runs.started_at', 'asc')
          .select(
            'runs.id',
            'runs.migrationReference',
            'runs.started_at',
            client.raw(
              'SUM(CASE WHEN comp.passed THEN 1 ELSE 0 END) as passed_count',
            ),
            client.raw(
              'SUM(CASE WHEN comp.partial THEN 1 ELSE 0 END) as partially_passed_count',
            ),
            client.raw('COUNT(comp."componentReference") as total_count'),
          );
        return rows.map((r: any) => ({
          id: r.id,
          migrationReference: r.migrationReference,
          started_at: r.started_at,
          passed_count: Number(r.passed_count),
          partially_passed_count: Number(r.partially_passed_count),
          total_count: Number(r.total_count),
        }));
      }

      return (await client
        .table('migration_check_runs')
        .where('migrationReference', migrationRef)
        .orderBy('started_at', 'asc')) as Array<MigrationRunResultDbEntity>;
    },
  };
}
