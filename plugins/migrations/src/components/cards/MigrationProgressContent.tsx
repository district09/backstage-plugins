import { Grid } from '@material-ui/core';
import { MigrationProgressCard } from './MigrationProgressCard.tsx';
import { MigrationRunnersSummary } from './MigrationRunnersSummary.tsx';

export const MigrationProgressContent = () => (
  <Grid container>
    <Grid item xs={4}>
      <MigrationProgressCard />
    </Grid>
    <Grid item xs={8}>
      <MigrationRunnersSummary />
    </Grid>
  </Grid>
);
