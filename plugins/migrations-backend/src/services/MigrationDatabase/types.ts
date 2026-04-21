import { CompoundEntityRef } from '@backstage/catalog-model';
import { CheckResultsDbEntity } from '@district09/backstage-plugin-migrations-node';

export interface MigrationDatabase {
  storeMigrationCheck(input: {
    migrationReference: CompoundEntityRef;
    results: Array<CheckResultsDbEntity>;
  }): Promise<void>;

  retrieveResultsFor({
    migrationReference,
  }: {
    migrationReference: CompoundEntityRef;
  }): Promise<Array<CheckResultsDbEntity>>;

  retrieveResultsForComponent(
    entity: CompoundEntityRef,
  ): Promise<Array<CheckResultsDbEntity>>;
}
