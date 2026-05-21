import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { CheckerService } from './types.ts';
import {
  CompoundEntityRef,
  getCompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  MigrationDatabase,
  migrationDatabaseServiceRef,
} from '../MigrationDatabase';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  ServiceFactory,
  ServiceRef,
} from '@backstage/backend-plugin-api';
import {
  CheckerStoreService,
  CheckResultsDbEntity,
} from '@district09/backstage-plugin-migrations-node';
import { checkerStoreServiceRef } from './CheckerStoreService.ts';
import {
  CatalogService,
  catalogServiceRef,
} from '@backstage/plugin-catalog-node';
import { isMigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';

export class DefaultCheckerService implements CheckerService {
  private readonly database: MigrationDatabase;
  private readonly logger: typeof coreServices.logger.T;
  private readonly checkerStore: CheckerStoreService;
  private readonly catalog: CatalogService;
  private readonly auth: typeof coreServices.auth.T;

  constructor({
    database,
    logger,
    checkerStore,
    catalog,
    auth,
  }: {
    database: MigrationDatabase;
    logger: typeof coreServices.logger.T;
    checkerStore: CheckerStoreService;
    catalog: CatalogService;
    auth: typeof coreServices.auth.T;
  }) {
    this.database = database;
    this.logger = logger;
    this.checkerStore = checkerStore;
    this.catalog = catalog;
    this.auth = auth;
  }

  async runMigrationChecks(migration: MigrationEntityV1): Promise<void> {
    const checksToRun = [
      ...new Map(
        migration.spec.checks
          .map(e => this.checkerStore.getChecker(e.checkId))
          .filter(
            (check): check is NonNullable<typeof check> => check !== undefined,
          )
          .map(c => [c.id, c] as const),
      ).values(),
    ];

    if (checksToRun.length <= 0) {
      this.logger.warn(
        `no checks to run for migration ${stringifyEntityRef(migration)}`,
      );
      return;
    }

    this.logger.info(
      `running ${checksToRun.length} checks for migration ${stringifyEntityRef(
        migration,
      )}: ${checksToRun.map(c => c?.id).join(', ')}`,
    );

    const rows: CheckResultsDbEntity[] = [];
    for (const checker of checksToRun) {
      const results = await checker.runCheckForAllRelatedEntities(migration);
      rows.push(...results);
    }
    if (rows.length <= 0) {
      this.logger.warn(
        `no check results for migration ${stringifyEntityRef(migration)}`,
      );
      return;
    }
    this.logger.info(
      `storing ${rows.length} check results for migration ${stringifyEntityRef(
        migration,
      )}`,
    );
    await this.database.storeMigrationCheck({
      migrationReference: getCompoundEntityRef(migration),
      results: rows,
    });
  }

  async runMigrationChecksForEntity(
    entityRef: CompoundEntityRef,
  ): Promise<void> {
    const credentials = await this.auth.getOwnServiceCredentials();

    const entity = await this.catalog.getEntityByRef(entityRef, {
      credentials,
    });
    if (!entity) {
      this.logger.warn(
        `Entity not found for single-entity check: ${stringifyEntityRef(
          entityRef,
        )}`,
      );
      return;
    }

    const { items: migrations } = await this.catalog.getEntities(
      { filter: [{ kind: 'Migration' }] },
      { credentials },
    );

    this.logger.info(
      `Running checks for entity ${stringifyEntityRef(entityRef)} across ${
        migrations.length
      } migrations`,
    );

    for (const migration of migrations) {
      if (!isMigrationEntityV1(migration)) {
        continue;
      }

      // Determine whether the entity falls within the migration's entityFilter
      // by narrowing the filter with the entity's own identity.
      const inScope = await this.isEntityInMigrationScope(entityRef, migration);

      if (!inScope) {
        continue;
      }

      const checksToRun = [
        ...new Map(
          migration.spec.checks
            .map(e => this.checkerStore.getChecker(e.checkId))
            .filter(check => check !== undefined)
            .map(c => [c.id, c] as const),
        ).values(),
      ];

      if (checksToRun.length <= 0) {
        this.logger.warn(
          `no checks to run for migration ${stringifyEntityRef(migration)}`,
        );
        continue;
      }

      const rows: CheckResultsDbEntity[] = [];
      for (const checker of checksToRun) {
        const results = await checker.runCheckForSingleEntity(
          entity,
          migration,
        );
        rows.push(...results);
      }

      this.logger.info(
        `storing ${rows.length} check results for entity ${stringifyEntityRef(
          entityRef,
        )} in migration ${stringifyEntityRef(migration)}`,
      );
      await this.database.storeEntityCheckResults({
        migrationReference: getCompoundEntityRef(migration),
        componentReference: entityRef,
        results: rows,
      });
    }
  }

  private async isEntityInMigrationScope(
    entityRef: CompoundEntityRef,
    migration: MigrationEntityV1,
  ): Promise<boolean> {
    if (!migration.spec.entityFilter) {
      return true;
    }
    const filterArr = Array.isArray(migration.spec.entityFilter)
      ? (migration.spec.entityFilter as Record<string, string | string[]>[])
      : [migration.spec.entityFilter as Record<string, string | string[]>];

    // AND the entity's own identity into each OR-branch of the migration filter
    const narrowedFilter = filterArr.map(condition => ({
      ...condition,
      'metadata.name': entityRef.name,
      'metadata.namespace': entityRef.namespace ?? 'default',
      kind: entityRef.kind,
    }));

    const credentials = await this.auth.getOwnServiceCredentials();
    const { items } = await this.catalog.getEntities(
      {
        filter: narrowedFilter,
        fields: ['metadata.name', 'kind', 'metadata.namespace'],
      },
      { credentials },
    );
    return items.length > 0;
  }
}

export const checkerServiceRef = createServiceRef<CheckerService>({
  id: 'migrations.checker',
  async defaultFactory(
    service: ServiceRef<CheckerService, 'plugin'>,
  ): Promise<ServiceFactory> {
    return createServiceFactory({
      service,
      deps: {
        database: migrationDatabaseServiceRef,
        logger: coreServices.logger,
        checkerStore: checkerStoreServiceRef,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
      },
      async factory({ database, logger, checkerStore, catalog, auth }) {
        return new DefaultCheckerService({
          database,
          logger,
          checkerStore,
          catalog,
          auth,
        });
      },
    });
  },
});
