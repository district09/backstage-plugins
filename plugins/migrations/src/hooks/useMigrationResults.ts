import { useRef } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  MigrationEntityV1,
  MigrationResultsResponse,
} from '@district09/backstage-plugin-migrations-common';
import { migrationsApiRef } from '../api';
import { useAsync } from 'react-use';

export type MigrationResultsFilter = 'owned' | 'all';

/**
 * Fetches migration results for the current entity, re-running when the filter
 * changes. Returns the previous value while a new fetch is in progress so
 * consumers can keep rendering stale data rather than blanking out.
 */
export const useMigrationResults = (
  filter: MigrationResultsFilter = 'owned',
) => {
  const migrationsApi = useApi(migrationsApiRef);
  const { entity } = useEntity<MigrationEntityV1>();
  const previousValueRef = useRef<MigrationResultsResponse | undefined>(
    undefined,
  );

  const { loading, error, value } = useAsync(
    () =>
      migrationsApi.getMigrationResults(entity, {
        offset: 0,
        pageSize: 500,
        filter,
      }),
    [entity, migrationsApi, filter],
  );

  if (!loading && value) {
    previousValueRef.current = value;
  }

  return {
    loading,
    error,
    // Keep showing previous data while the next fetch runs (stale-while-revalidate)
    value: value ?? previousValueRef.current,
  };
};
