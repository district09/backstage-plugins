import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  ServiceFactory,
  ServiceRef,
} from '@backstage/backend-plugin-api';
import { type EntityRefreshService } from './types';
import {
  type CheckSchedulerService,
  checkSchedulerServiceRef,
} from '../CheckSchedulerService';
import {
  type CatalogService,
  catalogServiceRef,
} from '@backstage/plugin-catalog-node';
import { getCompoundEntityRef } from '@backstage/catalog-model';

const createEntityRefreshService = async ({
  scheduler,
  catalog,
  auth,
}: {
  scheduler: CheckSchedulerService;
  catalog: CatalogService;
  auth: typeof coreServices.auth.T;
}): Promise<EntityRefreshService> => {
  return {
    refreshEntity: async (repoSlug: string): Promise<void> => {
      const credentials = await auth.getOwnServiceCredentials();
      const { items } = await catalog.getEntities(
        {
          filter: {
            'metadata.annotations.github.com/project-slug': repoSlug,
          },
          fields: ['metadata.name', 'metadata.namespace', 'kind'],
        },
        { credentials },
      );
      if (items.length <= 0) return;
      for (const entity of items) {
        await scheduler.dispatchImmediateEntityCheck(
          getCompoundEntityRef(entity),
        );
      }
    },
  };
};

export const entityRefreshServiceRef = createServiceRef<EntityRefreshService>({
  id: 'migrations.entity-refresh',
  async defaultFactory(
    service: ServiceRef<EntityRefreshService, 'plugin', 'singleton'>,
  ): Promise<ServiceFactory> {
    return createServiceFactory({
      service,
      deps: {
        scheduler: checkSchedulerServiceRef,
        catalog: catalogServiceRef,
        auth: coreServices.auth,
      },
      async factory(deps): Promise<EntityRefreshService> {
        return await createEntityRefreshService(deps);
      },
    });
  },
});
