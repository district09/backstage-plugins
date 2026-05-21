import {
  StatusError,
  StatusOK,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { Text } from '@backstage/ui';
import { ComponentMigrationResult } from '@district09/backstage-plugin-migrations-common';
import startCase from 'lodash/startCase';

const columns: TableColumn<ComponentMigrationResult>[] = [
  {
    title: 'Check',
    field: 'checkId',
    render: row => <Text>{startCase(row.checkId)}</Text>,
  },
  {
    title: 'Result',
    field: 'result',
    render: row => (row.result ? <StatusOK /> : <StatusError />),
    type: 'boolean',
  },
  { title: 'Description', field: 'description' },
  { title: 'Message', field: 'message' },
  { title: 'Checked At', field: 'checked_at' },
];

/** Renders a flat list of check results for a single component. */
export const CheckResultsPanel = ({
  results,
}: {
  results: ComponentMigrationResult[];
}) => (
  <Table
    title=""
    columns={columns}
    data={results}
    options={{
      paging: false,
      search: false,
      toolbar: false,
      padding: 'dense',
    }}
  />
);
