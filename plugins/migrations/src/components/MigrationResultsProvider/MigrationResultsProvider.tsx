import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { MigrationResultsResponse } from '@district09/backstage-plugin-migrations-common';
import {
  MigrationResultsFilter,
  useMigrationResults,
} from '../../hooks/useMigrationResults';

export interface MigrationResultsContextValue {
  filter: MigrationResultsFilter;
  setFilter: (filter: MigrationResultsFilter) => void;
  results: {
    loading: boolean;
    error?: Error;
    value?: MigrationResultsResponse;
  };
}

const MigrationResultsContext = createContext<
  MigrationResultsContextValue | undefined
>(undefined);

/** Provides shared migration results data and filter state to child components. */
export const MigrationResultsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [filter, setFilter] = useState<MigrationResultsFilter>('owned');
  const results = useMigrationResults(filter);

  return (
    <MigrationResultsContext.Provider value={{ filter, setFilter, results }}>
      {children}
    </MigrationResultsContext.Provider>
  );
};

export const useMigrationResultsContext = (): MigrationResultsContextValue => {
  const ctx = useContext(MigrationResultsContext);
  if (!ctx) {
    throw new Error(
      'useMigrationResultsContext must be used within MigrationResultsProvider',
    );
  }
  return ctx;
};
