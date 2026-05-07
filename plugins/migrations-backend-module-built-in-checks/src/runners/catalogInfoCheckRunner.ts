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
import { access } from '../util';

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
    this.id = checkConfig.id;
    this.description = buildDescription(checkConfig);
    this.config = checkConfig;
  }

  async runCheck(
    entity: Entity,
    migration: MigrationEntityV1,
  ): Promise<MigrationCheckResult> {
    this.logger.info(
      `Running catalog.info.yaml check on entity ${entity.metadata.name} for migration ${migration.metadata.name}`,
    );
    try {
      const pathValue = access(entity, this.config.path);
      switch (this.config.op) {
        case Operation.EXISTS:
          return {
            result: pathValue !== undefined,
            message:
              pathValue !== undefined
                ? 'Path exists'
                : `Path ${this.config.path} does not exist`,
          };
        case Operation.NOT_EXISTS:
          return {
            result: pathValue === undefined,
            message:
              pathValue === undefined
                ? 'Path does not exist'
                : `Path ${this.config.path} exists`,
          };
        case Operation.EQUALS:
          return {
            result: pathValue === this.config.value,
            message:
              pathValue === this.config.value
                ? `Path ${this.config.path} equals ${this.config.value}`
                : `Path ${this.config.path} does not equal ${this.config.value} - was ${pathValue}`,
          };
        case Operation.CONTAINS:
          return {
            result: pathValue?.includes(this.config.value),
            message: pathValue?.includes(this.config.value)
              ? `Path ${this.config.path} contains ${this.config.value}`
              : `Path ${this.config.path} does not contain ${this.config.value}`,
          };
        case Operation.NOT_EQUALS:
          return {
            result: pathValue !== this.config.value,
            message:
              pathValue !== this.config.value
                ? `Path ${this.config.path} does not equal ${this.config.value}`
                : `Path ${this.config.path} equals ${this.config.value}`,
          };
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
      return { result: false, message: `Error: ${e?.message}` };
    }
  }
}
