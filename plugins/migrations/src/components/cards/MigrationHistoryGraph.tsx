import { useApi } from '@backstage/frontend-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { getCompoundEntityRef } from '@backstage/catalog-model';
import { useAsync } from 'react-use';
import { migrationsApiRef } from '../../api';
import { InfoCard, Progress, WarningPanel } from '@backstage/core-components';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ChartPoint = {
  date: string;
  passed: number;
  partial: number;
  failed: number;
};

const dateFormatter = (value: string) => {
  const d = new Date(value);
  return isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const MigrationHistoryGraph = () => {
  const api = useApi(migrationsApiRef);
  const { entity } = useEntity<MigrationEntityV1>();

  const {
    value: data,
    loading,
    error,
  } = useAsync(async (): Promise<ChartPoint[]> => {
    const history = await api.getMigrationResultHistory(
      getCompoundEntityRef(entity),
    );
    return history.map(run => {
      const total = run.total_count || 1;
      return {
        date: run.started_at ?? '',
        passed: run.passed_count / total,
        partial: run.partially_passed_count / total,
        failed:
          (run.total_count - run.passed_count - run.partially_passed_count) /
          total,
      };
    });
  }, [entity, api]);

  return (
    <InfoCard title="Migration progress history">
      {loading && <Progress />}
      {error && (
        <WarningPanel title="Failed to load history" message={error.message} />
      )}
      {!loading && !error && data && data.length === 0 && (
        <WarningPanel
          title="No history yet"
          message="Run checks to start tracking progress over time."
        />
      )}
      {!loading && !error && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={dateFormatter}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={v => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={label => dateFormatter(String(label))}
              formatter={value => `${Math.round(Number(value) * 100)}%`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="passed"
              stackId="a"
              stroke="#4caf50"
              fill="#4caf50"
              fillOpacity={0.7}
              name="Passed"
            />
            <Area
              type="monotone"
              dataKey="partial"
              stackId="a"
              stroke="#ff9800"
              fill="#ff9800"
              fillOpacity={0.7}
              name="Partially passed"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stackId="a"
              stroke="#f44336"
              fill="#f44336"
              fillOpacity={0.7}
              name="Failed"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </InfoCard>
  );
};
