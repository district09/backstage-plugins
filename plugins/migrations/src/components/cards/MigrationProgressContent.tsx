import { Grid } from '@backstage/ui';
import { MigrationProgressCard } from './MigrationProgressCard.tsx';
import { MigrationRunnersSummary } from './MigrationRunnersSummary.tsx';

export const MigrationProgressContent = () => (
  <Grid.Root columns={{ sm: '12' }} gap="4">
    <Grid.Item colSpan={{ sm: '4' }}>
      <MigrationProgressCard />
    </Grid.Item>
    <Grid.Item colSpan={{ sm: '8' }}>
      <MigrationRunnersSummary />
    </Grid.Item>
  </Grid.Root>
);
