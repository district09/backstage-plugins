/**
 * Accesses a nested value in an object by a dot-separated path.
 * Supports bracket notation for keys that contain dots, e.g.:
 *   metadata.annotations['backstage.io/techdocs-ref']
 */
export const access = (obj: any, path: string): any => {
  // Tokenise: plain identifiers separated by '.', or ['key'] / ["key"] segments.
  const tokens: string[] = [];
  const regex = /([^.["[\]]+)|\[['"]([^'"]+)['"]\]/g;
  for (const match of path.matchAll(regex)) {
    tokens.push(match[1] ?? match[2]);
  }

  let result = obj;
  for (const key of tokens) {
    if (result === undefined || result === null) return undefined;
    result = result[key];
  }
  return result;
};
