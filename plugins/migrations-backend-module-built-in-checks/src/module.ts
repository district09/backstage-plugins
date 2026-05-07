import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { migrationCheckRunnerExtensionPoint } from '@district09/backstage-plugin-migrations-node';
import { getCatalogInfoConfig } from './util.ts';
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
        config: coreServices.rootConfig,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
      },
      async init({ logger, checkRunners, config, catalog, auth }) {
        logger.info('Registering built-in migration check runners');
        getCatalogInfoConfig(config).forEach(c => {
          checkRunners.addChecker(
            new CatalogInfoCheckRunner({
              catalog,
              logger,
              auth,
              checkConfig: c,
            }),
          );
        });
      },
    });
  },
});
