import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { migrationCheckRunnerExtensionPoint } from '@district09/backstage-plugin-migrations-node';
import { CatalogInfoCheckRunner } from './runners/catalogInfoCheckRunner.ts';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';

export const migrationsModuleBuiltInChecks = createBackendModule({
  pluginId: 'migrations',
  moduleId: 'built-in-checks',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        checkRunners: migrationCheckRunnerExtensionPoint,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
      },
      async init({ logger, checkRunners, catalog, auth }) {
        logger.info('Registering built-in migration check runners');
        checkRunners.addChecker(
          new CatalogInfoCheckRunner({ catalog, logger, auth }),
        );
      },
    });
  },
});
