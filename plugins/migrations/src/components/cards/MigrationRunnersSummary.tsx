import { useMemo } from 'react';
import { Box, Card, Grid, Text } from '@backstage/ui';
import { LinearGauge } from '@backstage/core-components';
import { useMigrationResultsContext } from '../MigrationResultsProvider';
import styles from './MigrationRunnersSummary.module.css';

interface RunnerResult {
  id: string;
  description?: string;
  passed_count: number;
  total_count: number;
}

export const MigrationRunnersSummary = () => {
  const {
    results: { value, loading, error },
  } = useMigrationResultsContext();

  const computed = useMemo((): RunnerResult[] | undefined => {
    if (!value) return undefined;
    const checks: RunnerResult[] = value.checks.map(i => ({
      ...i,
      passed_count: 0,
      total_count: 0,
    }));
    value.components
      .flatMap(i => i.results)
      .forEach(i => {
        const check = checks.find(c => c.id === i.checkId);
        if (check) {
          check.passed_count += i.result ? 1 : 0;
          check.total_count += 1;
        }
      });
    return checks;
  }, [value]);

  // TODO: improve loading and error states
  if (error || (!computed && loading)) return null;
  if (!computed) return null;

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
        {computed.map((result, index) => (
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
