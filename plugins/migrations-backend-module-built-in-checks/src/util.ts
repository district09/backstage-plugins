export const access = (obj: any, path: string): any => {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result[key];
    if (result === undefined) return undefined;
  }
  return result;
};
