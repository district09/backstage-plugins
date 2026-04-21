import { useEntity } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { alertApiRef, useApi } from '@backstage/frontend-plugin-api';
import { migrationsApiRef } from '../api';
import { IconLinkVerticalProps } from '@backstage/core-components';
import BuildIcon from '@material-ui/icons/Build';

export const useMigrationEntityIconLinkProps = (): Omit<
  IconLinkVerticalProps,
  'color'
> => {
  const { entity } = useEntity<MigrationEntityV1>();
  const api = useApi(migrationsApiRef);
  const alertApi = useApi(alertApiRef);

  const refreshFunc = async () => {
    const { success } = await api.refreshMigration(entity);
    alertApi.post({
      message: success
        ? `Refresh dispatched, checks will take a couple of minutes`
        : 'Refresh failed',
      severity: success ? 'success' : 'error',
    });
  };

  return {
    title: 'Refresh Migration',
    icon: <BuildIcon />,
    label: 'Refresh migration',
    onClick: refreshFunc,
  };
};
