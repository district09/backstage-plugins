import {
  Box,
  CellText,
  ColumnConfig,
  Table,
  ToggleButton,
  ToggleButtonGroup,
  useTable,
} from '@backstage/ui';
import { type Key, useEffect, useRef, useState } from 'react';
import { RouteFunc, useApi, useRouteRef } from '@backstage/frontend-plugin-api';
import { migrationsApiRef } from '../../api';
import {
  entityRouteParams,
  entityRouteRef,
  humanizeEntityRef,
  useEntity,
} from '@backstage/plugin-catalog-react';
import {
  ComponentMigrationResult,
  MigrationEntityV1,
} from '@district09/backstage-plugin-migrations-common';
import { StatusError, StatusOK } from '@backstage/core-components';
import { parseEntityRef } from '@backstage/catalog-model';

const createColumns = (
  checks: {
    id: string;
    description?: string | undefined;
  }[],
  entityRoute:
    | RouteFunc<{ name: string; kind: string; namespace: string }>
    | undefined,
): ColumnConfig<{
  id: string;
  results: Array<ComponentMigrationResult>;
}>[] => {
  return [
    {
      id: 'name',
      label: 'Name',
      isRowHeader: true,
      isSortable: false,
      cell: item => {
        const entityRef = parseEntityRef(item.id);
        const title = humanizeEntityRef(entityRef, {
          defaultNamespace: 'default',
        });
        if (!entityRoute) return <CellText title={title} />;
        const routeParams = entityRouteParams(entityRef);
        return (
          <CellText
            title={title.split(':')[1]}
            href={entityRoute(routeParams)}
          />
        );
      },
    },
    {
      id: 'kind',
      label: 'Kind',
      isRowHeader: false,
      isSortable: false,
      cell: item => {
        const entityRef = parseEntityRef(item.id);
        const kind = entityRef.kind;
        return <CellText title={kind} />;
      },
    },
    ...checks.map(c => ({
      id: c.id,
      label: c.id,
      isRowHeader: false,
      cell: (item: {
        id: string;
        results: Array<ComponentMigrationResult>;
      }) => {
        const result = item.results.find(r => r.checkId === c.id);
        if (result === undefined || !result.result)
          return <CellText title="" leadingIcon={<StatusError />} />;
        return <CellText title="" leadingIcon={<StatusOK />} />;
      },
    })),
  ];
};

export const MigrationEntityResultsTable = () => {
  const migrationsApi = useApi(migrationsApiRef);
  const entityRoute = useRouteRef(entityRouteRef);
  const { entity } = useEntity<MigrationEntityV1>();
  // const catalogApi = useApi(catalogApiRef);

  const [columns, setColumns] = useState(createColumns([], entityRoute));
  const [selected, setSelected] = useState<string>('owned');

  const { tableProps, reload } = useTable({
    mode: 'offset',
    async getData({ offset, pageSize, search, signal }) {
      // get results for this migration
      const r = await migrationsApi.getMigrationResults(entity, {
        offset,
        pageSize,
        search,
        signal,
        filter: selected,
      });
      setColumns(createColumns(r.checks, entityRoute));
      return {
        data: r.components,
        totalCount: r.totalCount,
      };
    },
    paginationOptions: {
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
    },
  });

  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);
  useEffect(() => {
    reloadRef.current();
  }, [selected]);

  return (
    <Box p="4" bg="neutral">
      <Box p="4" bg="neutral">
        <ToggleButtonGroup
          selectionMode="single"
          defaultSelectedKeys={[selected]}
          onSelectionChange={(keys: Set<Key>) =>
            setSelected(Array.from(keys)[0]?.toString())
          }
          disallowEmptySelection
        >
          <ToggleButton id="owned" key="owned">
            Owned
          </ToggleButton>
          <ToggleButton id="all" key="all">
            All
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Table columnConfig={columns} {...tableProps} />
    </Box>
  );
};
