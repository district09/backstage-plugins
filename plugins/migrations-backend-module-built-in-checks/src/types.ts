export enum Operation {
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
  EQUALS = 'equals',
  CONTAINS = 'contains',
  NOT_EQUALS = 'notEquals',
}

export type CatalogInfoCheckerConfig = {
  id: string;
  path: string;
  op: Operation;
  value: string;
};
