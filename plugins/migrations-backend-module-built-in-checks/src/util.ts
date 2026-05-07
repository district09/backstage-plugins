import { RootConfigService } from '@backstage/backend-plugin-api';
import { CatalogInfoCheckerConfig, Operation } from './types.ts';

export const getCatalogInfoConfig = (
  config: RootConfigService,
): CatalogInfoCheckerConfig[] => {
  const checksConfig = config.getOptionalConfigArray(
    'migrations.checks.builtIn.catalogInfo',
  );
  if (checksConfig === undefined) return [];

  return checksConfig.map((c): CatalogInfoCheckerConfig => {
    return {
      op: c.get<Operation>('op'),
      id: c.getString('id'),
      path: c.getString('path'),
      value: c.getString('value'),
    };
  });
};

export const access = (obj: any, path: string): any => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result[key];
    if (result === undefined) return undefined;
  }
  return result;
};
