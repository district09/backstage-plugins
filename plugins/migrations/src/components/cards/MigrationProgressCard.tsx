import { useMemo } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { GaugeCard } from '@backstage/core-components';
import { useMigrationResultsContext } from '../MigrationResultsProvider';

export const MigrationProgressCard = () => {
  const { entity } = useEntity<MigrationEntityV1>();
  const {
    results: { value, error },
  } = useMigrationResultsContext();

  const { passed, gaugeTotal } = useMemo(() => {
    const grouped: Record<string, boolean[]> = {};
    value?.components.forEach(item => {
      if (!grouped[item.id]) grouped[item.id] = [];
      grouped[item.id].push(...item.results.map(r => r.result));
    });
    const total = Object.keys(grouped).length;
    const p = Object.values(grouped).filter(r => r.every(Boolean)).length;
    return { passed: p, gaugeTotal: total > 0 ? total : 1 };
  }, [value]);

  if (error) return <div>{error.message}</div>;

  return (
    <GaugeCard
      title={entity.metadata.title ?? entity.metadata.name}
      progress={value ? passed / gaugeTotal : 0}
      variant="gridItem"
      description={value ? `${passed} / ${gaugeTotal}` : 'Loading'}
    />
  );
};
