import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { CheckerService } from './types.ts';
import {
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

export class DefaultCheckerService implements CheckerService {
  private readonly database: MigrationDatabase;
  private readonly logger: typeof coreServices.logger.T;
  private readonly checkerStore: CheckerStoreService;

  constructor({
    database,
    logger,
    checkerStore,
  }: {
    database: MigrationDatabase;
    logger: typeof coreServices.logger.T;
    checkerStore: CheckerStoreService;
  }) {
    this.database = database;
    this.logger = logger;
    this.checkerStore = checkerStore;
  }

  async runMigrationChecks(migration: MigrationEntityV1): Promise<void> {
    const checksToRun = migration.spec.checks
      .map(e => this.checkerStore.getChecker(e.checkId))
      .filter(check => check !== undefined);

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
      },
      async factory({ database, logger, checkerStore }) {
        return new DefaultCheckerService({
          database,
          logger,
          checkerStore,
        });
      },
    });
  },
});
