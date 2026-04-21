import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  makeStyles,
} from '@material-ui/core';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { useApi } from '@backstage/frontend-plugin-api';
import { migrationsApiRef } from '../../api';
import { useAsync } from 'react-use';
import { LinearGauge } from '@backstage/core-components';

interface RunnerResult {
  id: string;
  description?: string;
  passed_count: number;
  total_count: number;
}

const useStyles = makeStyles(_ => ({
  card: {
    height: 'calc(100% - 10px)',
    width: '400px',
    // flex: 1,
  },
}));

export const MigrationRunnersSummary = () => {
  const migrationsApi = useApi(migrationsApiRef);
  const { entity } = useEntity<MigrationEntityV1>();
  const { card } = useStyles();

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
    <Card className={card}>
      <CardHeader title="Runners" />
      <CardContent>
        {value.results.map((result, index) => (
          <Grid container spacing={2} key={index}>
            <Grid item xs={6}>
              {result.id}
            </Grid>
            <Grid item xs={6}>
              <LinearGauge value={result.passed_count / result.total_count} />
            </Grid>
          </Grid>
        ))}
      </CardContent>
    </Card>
  );
};
