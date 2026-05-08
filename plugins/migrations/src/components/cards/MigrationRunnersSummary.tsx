import { Box, Card, Grid, Text } from '@backstage/ui';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { useApi } from '@backstage/frontend-plugin-api';
import { migrationsApiRef } from '../../api';
import { useAsync } from 'react-use';
import { LinearGauge } from '@backstage/core-components';
import styles from './MigrationRunnersSummary.module.css';

interface RunnerResult {
  id: string;
  description?: string;
  passed_count: number;
  total_count: number;
}

export const MigrationRunnersSummary = () => {
  const migrationsApi = useApi(migrationsApiRef);
  const { entity } = useEntity<MigrationEntityV1>();

  const { value, loading, error } = useAsync(async () => {
    const r = await migrationsApi.getMigrationResults(entity, {
      offset: 0,
      pageSize: 0,
    });

    const checks: RunnerResult[] = r.checks.map(i => ({
      ...i,
      passed_count: 0,
      total_count: 0,
    }));
    r.components
      .flatMap(i => i.results)
      .forEach(i => {
        const check = checks.find(c => c.id === i.checkId);
        if (check) {
          check.passed_count += i.result ? 1 : 0;
          check.total_count += 1;
        }
      });

    return { results: checks };
  }, [entity, migrationsApi]);

  // TODO: improve loading and error states
  if (loading || !value || error) return null;

  return (
    <Card className={styles.card}>
      <Box style={{ padding: 'var(--bui-space-3)' }}>
        <Text
          as="p"
          variant="title-small"
          style={{ marginBottom: 'var(--bui-space-3)' }}
        >
          Runners
        </Text>
        {value.results.map((result, index) => (
          <Grid.Root columns={{ sm: '12' }} gap="4" key={index}>
            <Grid.Item colSpan={{ sm: '6' }}>{result.id}</Grid.Item>
            <Grid.Item colSpan={{ sm: '6' }}>
              <LinearGauge value={result.passed_count / result.total_count} />
            </Grid.Item>
          </Grid.Root>
        ))}
      </Box>
    </Card>
  );
};
