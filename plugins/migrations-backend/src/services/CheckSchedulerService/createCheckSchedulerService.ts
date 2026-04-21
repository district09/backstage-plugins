import {
  AuthService,
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  RootConfigService,
  SchedulerService,
  SchedulerServiceTaskScheduleDefinition,
  ServiceFactory,
  ServiceRef,
} from '@backstage/backend-plugin-api';
import {
  CatalogService,
  catalogServiceRef,
} from '@backstage/plugin-catalog-node';
import { CheckSchedulerService } from './types.ts';
import {
  CompoundEntityRef,
  getCompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { CheckerService, checkerServiceRef } from '../CheckerService';
import {
  isMigrationEntityV1,
  MigrationEntityV1,
} from '@district09/backstage-plugin-migrations-common';

export const checkSchedulerServiceRef = createServiceRef<CheckSchedulerService>(
  {
    id: 'migrations.checkScheduler',
    async defaultFactory(
      service: ServiceRef<CheckSchedulerService, 'plugin'>,
    ): Promise<ServiceFactory> {
      return createServiceFactory({
        service,
        deps: {
          logger: coreServices.logger,
          scheduler: coreServices.scheduler,
          rootConfig: coreServices.rootConfig,
          checkerService: checkerServiceRef,
          catalog: catalogServiceRef,
          auth: coreServices.auth,
        },
        async factory({
          logger,
          scheduler,
          rootConfig,
          checkerService,
          catalog,
          auth,
        }) {
          logger.info('Creating CheckSchedulerService');
          return await createCheckSchedulerService({
            logger,
            scheduler,
            rootConfig,
            checkerService,
            catalog,
            auth,
          });
        },
      });
    },
  },
);

export async function createCheckSchedulerService({
  logger,
  scheduler,
  rootConfig,
  checkerService,
  catalog,
  auth,
}: {
  logger: LoggerService;
  scheduler: SchedulerService;
  rootConfig: RootConfigService;
  checkerService: CheckerService;
  catalog: CatalogService;
  auth: AuthService;
}): Promise<CheckSchedulerService> {
  logger.info('Initializing CheckSchedulerService');
  const config = rootConfig.getConfig('migrations');
  const defaultSchedule: SchedulerServiceTaskScheduleDefinition = config.has(
    'schedule',
  )
    ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
        config.getConfig('schedule'),
      )
    : {
        frequency: { minutes: 30 },
        timeout: { minutes: 10 },
        scope: 'global',
      };

  async function addIfNeeded(taskId: string, compRef: CompoundEntityRef) {
    if (
      (await scheduler.getScheduledTasks()).findIndex(e => e.id === taskId) < 0
    ) {
      logger.info(`Adding scheduled task for migration check ${taskId}`);
      await scheduler.scheduleTask({
        id: taskId,
        scope: 'global',
        frequency: { trigger: 'manual' },
        timeout: defaultSchedule.timeout,
        fn: async () => {
          await checkMigration(compRef);
        },
      });
    }
  }

  // We don't directly check the migrations in the root schedule, but trigger a task, created for every migration.
  // This enables us to also trigger this task for refreshes
  await scheduler.scheduleTask({
    id: 'migrations.rootSchedule',
    scope: 'global',
    initialDelay: { seconds: 30 },
    ...defaultSchedule,
    fn: async () => {
      logger.info('Running scheduled migration checks');
      const migrations = await catalog.getEntities(
        {
          filter: [
            {
              kind: 'Migration',
            },
          ],
        },
        { credentials: await auth.getOwnServiceCredentials() },
      );

      if (migrations.items.length === 0) {
        logger.info('No migrations found for scheduled checks');
        return;
      }

      for (const migration of migrations.items) {
        // register the individual task for this migration
        const stringRef = stringifyEntityRef(migration);
        const compRef = getCompoundEntityRef(migration);
        const taskId = `migrations.check.${stringRef}`;
        await addIfNeeded(taskId, compRef);
        logger.info(`Triggering task for migration check ${taskId}`);
        await scheduler.triggerTask(taskId);
      }
    },
  });

  async function checkMigration(input: CompoundEntityRef): Promise<void> {
    const entity = await catalog.getEntityByRef(input, {
      credentials: await auth.getOwnServiceCredentials(),
    });
    if (!entity) {
      logger.warn(
        `Entity not found for migration check: ${stringifyEntityRef(input)}`,
      );
      return;
    }
    logger.info(`Running migration checks for ${stringifyEntityRef(input)}`);
    if (!isMigrationEntityV1(entity)) {
      logger.warn('Entity is not a MigrationEntityV1, skipping checks');
      return;
    }
    try {
      await checkerService.runMigrationChecks(entity as MigrationEntityV1);
      logger.info(
        `Migration checks completed successfully for ${stringifyEntityRef(
          input,
        )}`,
      );
    } catch (error) {
      logger.error(
        `Error running migration checks for ${stringifyEntityRef(
          input,
        )}: ${error}`,
      );
    }
  }

  return {
    async dispatchImmediateCheck(input: CompoundEntityRef): Promise<void> {
      logger.info(
        `dispatching immediate check for migration ${stringifyEntityRef(
          input,
        )}`,
      );
      const stringRef = stringifyEntityRef(input);
      const taskId = `migrations.check.${stringRef}`;
      await addIfNeeded(taskId, input);
      await scheduler.triggerTask(taskId);
    },
  };
}
