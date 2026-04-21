import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { MigrationKindProcessor } from './processor';

export const catalogModuleMigrations = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'migrations',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        extensionPoint: catalogProcessingExtensionPoint,
      },
      async init({ logger, extensionPoint }) {
        extensionPoint.addProcessor(new MigrationKindProcessor(logger));
      },
    });
  },
});
