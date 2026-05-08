import { useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { migrationsApiRef } from '../../api';
import { EntityRefLink, useEntity } from '@backstage/plugin-catalog-react';
import {
  ComponentMigrationResult,
  MigrationEntityV1,
} from '@district09/backstage-plugin-migrations-common';
import {
  StatusError,
  StatusOK,
  StatusWarning,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { parseEntityRef } from '@backstage/catalog-model';
import startCase from 'lodash/startCase';
import {
  Box,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
} from '@backstage/ui';
import { useAsync } from 'react-use';
import styles from './MigrationEntityResultsTable.module.css';

type RowData = {
  id: string;
  results: Array<ComponentMigrationResult>;
};

const createColumns = (
  checks: { id: string; description?: string | undefined }[],
): TableColumn<RowData>[] => {
  return [
    {
      title: 'Name',
      field: 'id',
      render: item => {
        const entityRef = parseEntityRef(item.id);
        return <EntityRefLink entityRef={entityRef} />;
      },
    },
    {
      title: 'Kind',
      field: 'id',
      render: item => {
        const entityRef = parseEntityRef(item.id);
        return <>{entityRef.kind}</>;
      },
    },
    ...checks.map(c => {
      const column: TableColumn<RowData> = {
        title: c.id,
        field: c.id,
        render: (item: RowData) => {
          const results = item.results.filter(r => r.checkId === c.id);
          const passCount = results.filter(r => r.result).length;
          const isPartial = passCount > 0 && passCount < results.length;
          const allPassed = results.length > 0 && passCount === results.length;

          let icon;
          if (allPassed) {
            icon = <StatusOK />;
          } else {
            icon = isPartial ? <StatusWarning /> : <StatusError />;
          }

          const messages = results
            .filter(r => r.message)
            .map(r => r.message)
            .join('\n');
          if (messages) {
            return (
              <TooltipTrigger>
                {icon}
                <Tooltip>{messages}</Tooltip>
              </TooltipTrigger>
            );
          }
          return icon;
        },
        customSort: (a, b) => {
          const score = (row: RowData) => {
            const results = row.results.filter(r => r.checkId === c.id);
            if (results.length === 0) return 3; // no results — sort last
            const passCount = results.filter(r => r.result).length;
            if (passCount === results.length) return 0; // all passed
            if (passCount > 0) return 1; // partial
            return 2; // all failed
          };
          return score(a) - score(b);
        },
      };
      return column;
    }),
  ];
};

const checkResultColumns: TableColumn<ComponentMigrationResult>[] = [
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

const CheckResultsPanel = ({
  results,
}: {
  results: Array<ComponentMigrationResult>;
}) => (
  <div className={styles.detailPanel}>
    <Table
      title=""
      columns={checkResultColumns}
      data={results}
      options={{
        paging: false,
        search: false,
        toolbar: false,
        padding: 'dense',
      }}
    />
  </div>
);

/** Shown on the migration entity page — lists all components checked in this migration. */
export const MigrationEntityResultsTable = () => {
  const migrationsApi = useApi(migrationsApiRef);
  const { entity } = useEntity<MigrationEntityV1>();
  const [selected, setSelected] = useState<string>('owned');

  const { loading, value } = useAsync(async () => {
    return await migrationsApi.getMigrationResults(entity, {
      offset: 0,
      pageSize: 500,
      filter: selected,
    });
  }, [entity, migrationsApi, selected]);

  const columns = createColumns(value?.checks ?? []);

  return (
    <Box style={{ padding: 'var(--bui-space-4)' }}>
      <Box style={{ marginBottom: 'var(--bui-space-4)' }}>
        <ToggleButtonGroup
          selectionMode="single"
          selectedKeys={new Set([selected])}
          onSelectionChange={keys => {
            const val = [...keys][0];
            if (val) setSelected(val as string);
          }}
        >
          <ToggleButton id="owned">Owned</ToggleButton>
          <ToggleButton id="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Table
        title="Components"
        columns={columns}
        data={value?.components ?? []}
        isLoading={loading}
        options={{ paging: true, pageSize: 10, search: true }}
        detailPanel={[
          {
            tooltip: 'Show check details',
            render: ({ rowData }: { rowData: RowData }) => (
              <CheckResultsPanel results={rowData.results} />
            ),
          },
        ]}
      />
    </Box>
  );
};
