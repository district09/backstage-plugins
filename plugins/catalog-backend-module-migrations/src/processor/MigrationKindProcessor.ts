import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  Entity,
  getCompoundEntityRef,
  KindValidator,
  parseEntityRef,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  MigrationEntityV1,
  migrationEntityV1Validator,
} from '@district09/backstage-plugin-migrations-common';
import { LoggerService } from '@backstage/backend-plugin-api';

export class MigrationKindProcessor implements CatalogProcessor {
  private readonly validators: KindValidator[] = [migrationEntityV1Validator];

  constructor(private readonly logger: LoggerService) {}

  getProcessorName(): string {
    return 'MigrationKindProcessor';
  }

  async postProcessEntity(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
    _cache: CatalogProcessorCache,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    const doEmit = (
      targets: string[],
      context: { defaultKind?: string; defaultNamespace: string },
      outgoingRelation: string,
      incomingRelation: string,
    ): void => {
      if (!targets) {
        return;
      }
      for (const target of targets) {
        const targetRef = parseEntityRef(target, context);
        this.logger.debug(
          `emitting ${outgoingRelation} relation from ${stringifyEntityRef(
            selfRef,
          )} to ${stringifyEntityRef(targetRef)}`,
        );
        emit(
          processingResult.relation({
            source: selfRef,
            type: outgoingRelation,
            target: targetRef,
          }),
        );
        this.logger.debug(
          `emitting ${incomingRelation} relation from ${stringifyEntityRef(
            targetRef,
          )} to ${stringifyEntityRef(selfRef)}`,
        );
        emit(
          processingResult.relation({
            source: targetRef,
            type: incomingRelation,
            target: selfRef,
          }),
        );
      }
    };

    if (
      entity.kind === 'Migration' &&
      entity.apiVersion === 'backstage.district09.gent/v1'
    ) {
      try {
        // Emit ownership relations
        const migration = entity as MigrationEntityV1;
        doEmit(
          [migration.spec.owner],
          { defaultKind: 'Group', defaultNamespace: selfRef.namespace },
          RELATION_OWNED_BY,
          RELATION_OWNER_OF,
        );
      } catch (e) {
        this.logger.error(
          `Error processing migration entity ${selfRef}: ${
            (e as Error).message
          }`,
        );
        processingResult.generalError(
          location,
          `Error processing migration entity ${selfRef}: ${
            (e as Error).message
          }`,
        );
      }
    }

    return entity;
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    for (const validator of this.validators) {
      if (await validator.check(entity)) return true;
    }
    return false;
  }
}
