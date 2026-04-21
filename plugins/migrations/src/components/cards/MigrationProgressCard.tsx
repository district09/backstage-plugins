import { useEntity } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { useAsync } from 'react-use';
import { migrationsApiRef } from '../../api';
import { useApi } from '@backstage/frontend-plugin-api';
import { GaugeCard } from '@backstage/core-components';

export const MigrationProgressCard = () => {
  const { entity } = useEntity<MigrationEntityV1>();
  const api = useApi(migrationsApiRef);
  const { value, loading, error } = useAsync(async () => {
    const results = await api.getMigrationResults(entity, {
      offset: 0,
      pageSize: 0,
    });

    const grouped: Record<string, boolean[]> = {};
    results.components.forEach(item => {
      if (!grouped[item.id]) {
        grouped[item.id] = [];
      }
      grouped[item.id].push(...item.results.map(r => r.result));
    });

    const total = Object.keys(grouped).length;
    const passed = Object.values(grouped).filter(r => r.every(Boolean)).length;

    if (total > 0) {
      return { total, passed };
    }
    return { total: 1, passed };
  }, [entity, api]);

  if (error) return <div>{error.message}</div>;

  return (
    <GaugeCard
      title={
        loading ? 'Loading' : entity.metadata.title ?? entity.metadata.name
      }
      progress={value ? value.passed / value.total : 0}
      variant="gridItem"
      description={value ? `${value.passed} / ${value.total}` : 'Loading'}
    />
  );
};
