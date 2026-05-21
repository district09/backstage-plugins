import { Box } from '@backstage/ui';
import { useApi } from '@backstage/frontend-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { migrationsApiRef } from '../../api';
import { getCompoundEntityRef } from '@backstage/catalog-model';
import { useAsync } from 'react-use';
import { CheckResultsPanel } from '../CheckResultsPanel';

/** Shown on the "Migrations" tab of a Component or API entity page. */
export const EntityContentMigration = () => {
  const migrationsApi = useApi(migrationsApiRef);
  const { entity } = useEntity();

  const { value: results = [] } = useAsync(
    () => migrationsApi.getComponentResults(getCompoundEntityRef(entity)),
    [entity, migrationsApi],
  );

  return (
    <Box p="4">
      <CheckResultsPanel results={results} />
    </Box>
  );
};
