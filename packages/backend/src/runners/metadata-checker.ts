import { Entity } from '@backstage/catalog-model';
import {
  BaseMigrationChecker,
  MigrationChecker,
  MigrationCheckResult,
} from '@district09/backstage-plugin-migrations-node';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { coreServices } from '@backstage/backend-plugin-api';

const buildMessage = (
  hasTitle: boolean,
  hasDescription: boolean,
  hasTags: boolean,
): string | undefined => {
  const missingProps = [];
  if (!hasTitle) {
    missingProps.push('title');
  }
  if (!hasDescription) {
    missingProps.push('description');
  }

  if (!hasTags) {
    missingProps.push('tags');
  }
  return missingProps.length > 0
    ? `missing required metadata fields: ${missingProps.join(', ')}`
    : undefined;
};

export class EntityMetadataChecker
  extends BaseMigrationChecker
  implements MigrationChecker
{
  description: string =
    'Checks if the entity has the required metadata fields for migration (title, description, tags)';
  id: string = 'entity-metadata-checker';

  constructor({
    catalog,
    logger,
    auth,
  }: {
    catalog: typeof catalogServiceRef.T;
    logger: typeof coreServices.logger.T;
    auth: typeof coreServices.auth.T;
  }) {
    super({ catalog, logger, auth });
  }

  async runCheck(
    entity: Entity,
    _migration: MigrationEntityV1,
  ): Promise<MigrationCheckResult> {
    const hasTitle =
      entity.metadata.title !== undefined && entity.metadata.title.length > 0;
    const hasDescription =
      entity.metadata.description !== undefined &&
      entity.metadata.description.length > 0;
    const hasTags =
      entity.metadata.tags !== undefined && entity.metadata.tags.length > 0;

    return {
      result: hasTitle && hasDescription && hasTags,
      message: buildMessage(hasTitle, hasDescription, hasTags),
    };
  }
}
