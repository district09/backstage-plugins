import { LinearGauge, Progress, TableColumn } from '@backstage/core-components';
import { CatalogTableRow } from '@backstage/plugin-catalog';
import { EntityRefLink } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { useApi } from '@backstage/core-plugin-api';
import { migrationsApiRef } from '../../api';
import { useAsync } from 'react-use';

const MigrationProgressRow = ({ entity }: { entity: MigrationEntityV1 }) => {
  const api = useApi(migrationsApiRef);

  const { value, loading, error } = useAsync(async () => {
    return await api.getMigrationResults(entity, { pageSize: 0, offset: 0 });
  }, [entity, api]);

  if (!value || loading) return <Progress />;
  if (error) {
    return <div>Error loading migration results</div>;
  }
  const progress: boolean[] = [];
  value.components
    .flatMap(e => e.results)
    .forEach(r => progress.push(r.result));

  const total = progress.length;
  const passed = progress.filter(r => r).length;

  // eslint-disable-next-line no-console
  console.log(
    `Migration ${entity.metadata.name} total: ${total}, passed: ${passed}`,
  );

  return <LinearGauge value={total > 0 ? passed / total : 0} />;
};

export const columns: TableColumn<CatalogTableRow>[] = [
  {
    title: 'Name',
    field: 'metadata.name',
    highlight: true,
    render: ({ entity }) => (
      <EntityRefLink entityRef={entity} defaultKind="Migration" />
    ),
  },
  {
    title: 'Progress',
    render: ({ entity }) => (
      <MigrationProgressRow entity={entity as MigrationEntityV1} />
    ),
  },
];
