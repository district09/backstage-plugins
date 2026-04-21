import {
  Entity,
  entityKindSchemaValidator,
  KindValidator,
} from '@backstage/catalog-model';
import { JsonObject } from '@backstage/types';
import migrationSchema from './migrationv1.schema.json';

/**
 * In this package you might for example declare types that are common
 * between the frontend and backend plugin packages.
 */
export interface MigrationEntityV1 extends Entity {
  /**
   * The apiVersion string of the TaskSpec.
   */
  apiVersion: 'backstage.district09.gent/v1';
  /**
   * The kind of the entity
   */
  kind: 'Migration';
  /**
   * The specification of the Template Entity
   */
  spec: {
    /**
     * The type that the Template will create. For example service, website or library.
     */
    type: string;
    /**
     * The owner of the migration.
     */
    owner: string;

    /**
     * The due date of the migration in YYYY-MM-DD format.
     */
    dueDate: string;
    /**
     * determines if the migration is mandatory or not.
     * If true, the migration must be completed.
     * If false, the migration is optional.
     * @default false
     */
    mandatory: boolean;

    entityFilter?:
      | Record<string, string | string[]>[]
      | Record<string, string | string[]>;

    /**
     * The checks that need to be run for this migration project.
     * Each check is represented by a MigrationCheckV1 object.
     * @default []
     */
    checks: Array<MigrationCheckV1>;
  };
}

/**
 * Represents a relation between the migration project and the checks that need to be run.
 */
export interface MigrationCheckV1 extends JsonObject {
  /**
   * Unique identifier of the check.
   */
  checkId: string;
}

const validator = entityKindSchemaValidator(migrationSchema);

export const migrationEntityV1Validator: KindValidator = {
  async check(data: Entity) {
    return validator(data) === data;
  },
};

export const isMigrationEntityV1 = (
  entity: Entity,
): entity is MigrationEntityV1 =>
  entity.apiVersion === 'backstage.district09.gent/v1' &&
  entity.kind === 'Migration';

export interface ComponentMigrationResult {
  checkId: string;
  result: boolean;
  checked_at?: string;
}

export type SingleComponentMigrationResult = ComponentMigrationResult & {
  migrationReference: string;
};

export interface MigrationResultsResponse {
  checks: Array<{
    id: string;
    description?: string;
  }>;
  components: Array<{
    id: string;
    results: Array<ComponentMigrationResult>;
  }>;
  totalCount: number;
}
