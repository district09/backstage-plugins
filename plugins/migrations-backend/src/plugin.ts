import {
  coreServices,
  createBackendPlugin,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router.ts';
import { checkSchedulerServiceRef } from './services/CheckSchedulerService';
import { migrationDatabaseServiceRef } from './services/MigrationDatabase';
import { checkerStoreServiceRef } from './services/CheckerService';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import {
  MigrationChecker,
  migrationCheckRunnerExtensionPoint,
} from '@district09/backstage-plugin-migrations-node';

/**
 * MigrationsPlugin backend plugin
 *
 * @public
 */
export const migrationsPlugin = createBackendPlugin({
  pluginId: 'migrations',
  register(env) {
    const checkers = new Map<string, MigrationChecker>();
    env.registerExtensionPoint(migrationCheckRunnerExtensionPoint, {
      addChecker(checker: MigrationChecker) {
        if (checkers.has(checker.id)) {
          throw new Error(
            `Migration checker with id ${checker.id} already exists.`,
          );
        }
        checkers.set(checker.id, checker);
      },
    });

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        checkScheduler: checkSchedulerServiceRef,
        database: migrationDatabaseServiceRef,
        bDatabase: coreServices.database,
        checkerStore: checkerStoreServiceRef,
        catalog: catalogServiceRef,
        userInfo: coreServices.userInfo,
        auth: coreServices.auth,
      },
      async init({
        httpRouter,
        checkScheduler,
        logger,
        database,
        bDatabase,
        checkerStore,
        catalog,
        userInfo,
        auth,
        httpAuth,
      }) {
        const client = await bDatabase.getClient();
        const migrationPath = resolvePackagePath(
          '@district09/backstage-plugin-migrations-backend',
          'migrations',
        );
        if (!bDatabase.migrations?.skip) {
          await client.migrate.latest({
            directory: migrationPath,
          });
        }
        checkers.forEach(c => checkerStore.addChecker(c));
        httpRouter.use(
          await createRouter({
            checkSchedulerService: checkScheduler,
            dbService: database,
            catalog,
            userInfo,
            auth,
            httpAuth,
            logger,
          }),
        );
      },
    });
  },
});
