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
  Table,
  TableColumn,
} from '@backstage/core-components';
import { parseEntityRef } from '@backstage/catalog-model';
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { useAsync } from 'react-use';

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
    ...checks.map(c => ({
      title: c.id,
      field: c.id,
      render: (item: RowData) => {
        const result = item.results.find(r => r.checkId === c.id);
        const icon =
          result === undefined || !result.result ? (
            <StatusError />
          ) : (
            <StatusOK />
          );
        if (result?.message) {
          return <Tooltip title={result.message}>{icon}</Tooltip>;
        }
        return icon;
      },
    })),
  ];
};

const useDetailPanelStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2, 4),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
  },
  header: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  checkId: {
    fontWeight: 'lighter',
  },
  icon: {
    color: theme.palette.error.main,
    minWidth: 32,
  },
}));

const FailedChecksPanel = ({
  results,
}: {
  results: Array<ComponentMigrationResult>;
}) => {
  const classes = useDetailPanelStyles();
  const failed = results.filter(r => !r.result && r.message);

  if (failed.length === 0) return null;

  return (
    <Box className={classes.root}>
      <Typography variant="caption" className={classes.header}>
        Failed checks
      </Typography>
      <List dense disablePadding>
        {failed.map((r, i) => (
          <Box key={r.checkId}>
            {i > 0 && <Divider component="li" />}
            <ListItem disableGutters>
              <ListItemIcon className={classes.icon}>
                <ErrorOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" className={classes.checkId}>
                    {r.checkId}
                  </Typography>
                }
                secondary={r.message}
              />
            </ListItem>
          </Box>
        ))}
      </List>
    </Box>
  );
};

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
    <Box p={2}>
      <Box mb={2}>
        <ToggleButtonGroup
          exclusive
          value={selected}
          onChange={(_e, val) => {
            if (val !== null) setSelected(val);
          }}
          size="small"
        >
          <ToggleButton value="owned">Owned</ToggleButton>
          <ToggleButton value="all">All</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Table
        title="Migration Results"
        columns={columns}
        data={value?.components ?? []}
        isLoading={loading}
        options={{ paging: true, pageSize: 10, search: true }}
        detailPanel={[
          {
            tooltip: 'Show failed check messages',
            render: ({ rowData }: { rowData: RowData }) => (
              <FailedChecksPanel results={rowData.results} />
            ),
          },
        ]}
      />
    </Box>
  );
};
