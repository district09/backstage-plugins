import { coreServices } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { MigrationEntityV1 } from '@district09/backstage-plugin-migrations-common';
import {
  BaseMigrationChecker,
  MigrationChecker,
  MigrationCheckResult,
} from '@district09/backstage-plugin-migrations-node';
import { type CatalogInfoCheckerConfig, Operation } from '../types';

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
  id: string;
  description: string;
  config: CatalogInfoCheckerConfig;

  constructor({
    catalog,
    logger,
    auth,
    checkConfig,
  }: {
    catalog: typeof catalogServiceRef.T;
    logger: typeof coreServices.logger.T;
    auth: typeof coreServices.auth.T;
    checkConfig: CatalogInfoCheckerConfig;
  }) {
    super({ catalog, logger, auth });
    this.id = `catalog-info-${checkConfig.id}`;
    this.description = buildDescription(checkConfig);
    this.config = checkConfig;
  }

  async runCheck(
    entity: Entity,
    migration: MigrationEntityV1,
  ): Promise<MigrationCheckResult> {
    try {
      switch (this.config.op) {
        case Operation.EXISTS:
          return {

          };
        case Operation.NOT_EXISTS:
          break;
        case Operation.EQUALS:
          break;
        case Operation.CONTAINS:
          break;
        case Operation.NOT_EQUALS:
          break;
        default:
          throw new Error(
            `Unknown operation ${this.config.op} for catalog.info.yaml check`,
          );
      }
    } catch (e: any) {
      this.logger.error(
        `Error running catalog.info.yaml check: ${e?.message}`,
        e,
      );
    }
  }
}
