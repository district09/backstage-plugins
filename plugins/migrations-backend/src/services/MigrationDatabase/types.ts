import { CompoundEntityRef } from '@backstage/catalog-model';
import {
  CheckResultsDbEntity,
  ComponentRunResultDbEntity,
  MigrationRunResultDbEntity,
} from '@district09/backstage-plugin-migrations-node';

export interface MigrationDatabase {
  storeMigrationCheck(input: {
    migrationReference: CompoundEntityRef;
    results: Array<CheckResultsDbEntity>;
  }): Promise<void>;

  storeEntityCheckResults(input: {
    migrationReference: CompoundEntityRef;
    componentReference: CompoundEntityRef;
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

  storeCheckResult(input: {
    run: MigrationRunResultDbEntity;
    components: Array<
      Pick<
        ComponentRunResultDbEntity,
        'componentReference' | 'passed' | 'partial'
      >
    >;
  }): Promise<void>;

  getResultHistory(
    migration: CompoundEntityRef,
    params?: { componentRefs?: string[] },
  ): Promise<Array<MigrationRunResultDbEntity>>;
}
