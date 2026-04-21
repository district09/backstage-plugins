import { EntityFilterQuery } from '@backstage/catalog-client';
import { useApi } from '@backstage/frontend-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { useAsync } from 'react-use';

export const useMigrations = (entityFilter: EntityFilterQuery) => {
  const catalogApi = useApi(catalogApiRef);

  const { value, loading, error } = useAsync(async () => {
    const response = await catalogApi.getEntities({
      filter: {
        kind: 'Migration',
        ...entityFilter,
      },
    });
    return response.items;
  }, [catalogApi]);

  return { migrations: value, loading, error };
};

export const useEntitiesMigratedBy = () => {
  const catalogApi = useApi(catalogApiRef);

  const { value, loading, error } = useAsync(async () => {
    const response = await catalogApi.getEntities({
      filter: {},
    });
    return response.items;
  }, [catalogApi]);

  return { migrations: value, loading, error };
};
