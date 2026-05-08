import { coreServices } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import {
  BaseMigrationChecker,
  MigrationChecker,
  MigrationCheckResultEmitter,
} from '@district09/backstage-plugin-migrations-node';
import { type CatalogInfoCheckerConfig, Operation } from '../types';
import { access } from '../util';

const CATALOG_INFO_CHECK_ID = 'catalog-info';

const buildDescription = (checkConfig: CatalogInfoCheckerConfig): string => {
  switch (checkConfig.op) {
    case Operation.EXISTS:
      return `Check catalog.info.yaml for existence of ${checkConfig.path}`;
    case Operation.NOT_EXISTS:
      return `Check catalog.info.yaml for non-existence of ${checkConfig.path}`;
    case Operation.EQUALS:
      return `Check catalog.info.yaml if ${checkConfig.path} equals ${checkConfig.value}`;
    case Operation.NOT_EQUALS:
      return `Check catalog.info.yaml if ${checkConfig.path} does not equal ${checkConfig.value}`;
    case Operation.CONTAINS:
      return `Check catalog-info.yaml if ${checkConfig.path} contains ${checkConfig.value}`;
    default:
      return `Unknown operation ${checkConfig.op} for catalog.info.yaml check`;
  }
};

export class CatalogInfoCheckRunner
  extends BaseMigrationChecker
  implements MigrationChecker
{
  id = CATALOG_INFO_CHECK_ID;
  description =
    'Runs catalog-info.yaml checks configured on the migration entity';

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
    migration: MigrationEntityV1,
    emit: MigrationCheckResultEmitter,
  ): Promise<void> {
    this.logger.info(
      `Running catalog-info.yaml checks on entity ${entity.metadata.name} for migration ${migration.metadata.name}`,
    );

    const catalogInfoChecks = migration.spec.checks.filter(
      c => c.checkId === CATALOG_INFO_CHECK_ID,
    );

    for (const check of catalogInfoChecks) {
      const checkConfig = check.config as unknown as CatalogInfoCheckerConfig;
      if (!checkConfig) {
        this.logger.warn(
          `No config found for catalog-info check in migration ${migration.metadata.name}`,
        );
        continue;
      }

      const description = buildDescription(checkConfig);
      try {
        const pathValue = access(entity, checkConfig.path);
        switch (checkConfig.op) {
          case Operation.EXISTS:
            emit({
              checkId: CATALOG_INFO_CHECK_ID,
              description,
              result: pathValue !== undefined,
              message:
                pathValue !== undefined
                  ? undefined
                  : `Path ${checkConfig.path} does not exist`,
            });
            break;
          case Operation.NOT_EXISTS:
            emit({
              checkId: CATALOG_INFO_CHECK_ID,
              description,
              result: pathValue === undefined,
              message:
                pathValue === undefined
                  ? undefined
                  : `Path ${checkConfig.path} exists`,
            });
            break;
          case Operation.EQUALS:
            emit({
              checkId: CATALOG_INFO_CHECK_ID,
              description,
              result: pathValue === checkConfig.value,
              message:
                pathValue === checkConfig.value
                  ? undefined
                  : `Path ${checkConfig.path} does not equal ${checkConfig.value} - was ${pathValue}`,
            });
            break;
          case Operation.CONTAINS:
            emit({
              checkId: CATALOG_INFO_CHECK_ID,
              description,
              result: pathValue?.includes(checkConfig.value),
              message: pathValue?.includes(checkConfig.value)
                ? undefined
                : `Path ${checkConfig.path} does not contain ${checkConfig.value}`,
            });
            break;
          case Operation.NOT_EQUALS:
            emit({
              checkId: CATALOG_INFO_CHECK_ID,
              description,
              result: pathValue !== checkConfig.value,
              message:
                pathValue !== checkConfig.value
                  ? undefined
                  : `Path ${checkConfig.path} equals ${checkConfig.value}`,
            });
            break;
          default:
            throw new Error(
              `Unknown operation ${checkConfig.op} for catalog.info.yaml check`,
            );
        }
      } catch (e: any) {
        this.logger.error(
          `Error running catalog.info.yaml check: ${e?.message}`,
          e,
        );
        emit({
          checkId: CATALOG_INFO_CHECK_ID,
          description,
          result: false,
          message: `Error: ${e?.message}`,
        });
      }
    }
  }
}
