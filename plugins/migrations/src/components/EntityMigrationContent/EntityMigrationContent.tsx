import { Chip, Grid, Typography } from '@material-ui/core';
import {
  StatusError,
  StatusOK,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useApi } from '@backstage/frontend-plugin-api';
import { humanizeEntityRef, useEntity } from '@backstage/plugin-catalog-react';
import { migrationsApiRef } from '../../api';
import { useAsync } from 'react-use';
import { getCompoundEntityRef, parseEntityRef } from '@backstage/catalog-model';
import startCase from 'lodash/startCase';
import { ComponentMigrationResult } from '@district09/backstage-plugin-migrations-common';

type CombinedResults = ComponentMigrationResult & {
  in_migrations: Set<string>;
};

export const EntityMigrationContent = () => {
  const migrationsApi = useApi(migrationsApiRef);
  const { entity } = useEntity();

  const { loading, error, value } = useAsync(async () => {
    const results = await migrationsApi.getComponentResults(
      getCompoundEntityRef(entity),
    );

    const combinedResults = results.reduce(
      (acc: { [key: string]: CombinedResults }, curr) => {
        if (!acc[curr.checkId]) {
          acc[curr.checkId] = {
            ...curr,
            in_migrations: new Set([curr.migrationReference]),
          };
        } else {
          acc[curr.checkId].in_migrations.add(curr.migrationReference);
        }
        if (!acc[curr.checkId].result && curr.result) {
          acc[curr.checkId].result = true;
        }
        return acc;
      },
      {},
    );

    return {
      results: combinedResults,
    };
  }, [entity, migrationsApi]);

  const columns: TableColumn<CombinedResults>[] = [
    {
      title: 'Check ID',
      field: 'checkId',
      type: 'string',
      render: rowData => <Typography>{startCase(rowData.checkId)}</Typography>,
    },
    {
      title: 'Result',
      field: 'result',
      render: row => (row.result ? <StatusOK /> : <StatusError />),
      type: 'boolean',
    },
    { title: 'Description', field: 'description' },
    {
      title: 'Checked in migrations',
      field: 'in_migrations',
      render: row => (
        <>
          {[...row.in_migrations].map(m => (
            <Chip
              key={m}
              title={m}
              label={humanizeEntityRef(parseEntityRef(m))}
            />
          ))}
        </>
      ),
    },
    { title: 'Checked At', field: 'checked_at' },
  ];

  if (!value || error) return null;

  const data = Object.values(value.results);

  return (
    <Grid container spacing={2}>
      <Grid md={12} item>
        <Table
          title="Check Results"
          columns={columns}
          data={data}
          options={{
            paging: false,
            search: false,
          }}
          isLoading={loading}
        />
      </Grid>
    </Grid>
  );
};
