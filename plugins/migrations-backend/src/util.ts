import { InputError } from '@backstage/errors';

type PaginationQuery = {
  pageSize?: unknown;
  offset?: unknown;
};

function toOptionalNumber(
  value: unknown,
  fieldName: string,
): number | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    throw new InputError(`Invalid ${fieldName}, must be a single value`);
  }
  const n =
    // eslint-disable-next-line no-nested-ternary
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : NaN;

  if (!Number.isFinite(n)) {
    throw new InputError(`Invalid ${fieldName}, must be a number`);
  }
  return n;
}

export function parsePaginationParams({
  pageSize,
  offset,
}: PaginationQuery): { pageSize?: number; offset?: number } | undefined {
  const parsedPageSize = toOptionalNumber(pageSize, 'pageSize');
  const parsedOffset = toOptionalNumber(offset, 'offset');

  if (parsedPageSize === undefined && parsedOffset === undefined) {
    return undefined;
  }

  if (parsedOffset !== undefined && parsedOffset < 0) {
    throw new InputError(`Invalid offset, must be zero or greater`);
  }
  if (parsedPageSize !== undefined && parsedPageSize < 0) {
    throw new InputError(`Invalid pageSize, must be greater than zero`);
  }

  return {
    ...(parsedOffset !== undefined ? { offset: parsedOffset } : {}),
    ...(parsedPageSize !== undefined ? { pageSize: parsedPageSize } : {}),
  };
}

export function paginate<T>(
  items: T[],
  { pageSize, offset }: { pageSize: number; offset: number },
): T[] {
  return items.slice(offset, offset + pageSize);
}
