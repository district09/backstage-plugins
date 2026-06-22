import { MigrationResultsProvider } from '../MigrationResultsProvider';
import { MigrationProgressContent } from '../cards/MigrationProgressContent';
import { MigrationEntityResultsTable } from '../MigrationEntityResultsTable';
import { MigrationHistoryGraph } from '../cards/MigrationHistoryGraph.tsx';

/**
 * Combines the migration progress cards and results table under a single
 * MigrationResultsProvider so all children share one API call and one filter state.
 */
export const MigrationEntityDashboard = () => (
  <MigrationResultsProvider>
    <MigrationProgressContent />
    <MigrationHistoryGraph />
    <MigrationEntityResultsTable />
  </MigrationResultsProvider>
);
