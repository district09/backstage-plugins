import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { migrationCheckRunnerExtensionPoint } from '@district09/backstage-plugin-migrations-node';
import { EntityMetadataChecker } from './metadata-checker';

const migrationsModuleCheckRunners = createBackendModule({
  pluginId: 'migrations',
  moduleId: 'checkers',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        checkerStore: migrationCheckRunnerExtensionPoint,
        auth: coreServices.auth,
        urlReader: coreServices.urlReader,
        catalog: catalogServiceRef,
      },
      async init(deps) {
        deps.checkerStore.addChecker(new EntityMetadataChecker(deps));
        deps.logger.info('Migrations Module Check Runners initialized');
      },
    });
  },
});

export { migrationsModuleCheckRunners as default };
