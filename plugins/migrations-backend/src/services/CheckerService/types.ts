import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';

export interface CheckerService {
  runMigrationChecks(migration: MigrationEntityV1): Promise<void>;
}
