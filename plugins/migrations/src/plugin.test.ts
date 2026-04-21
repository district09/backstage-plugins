import { migrationsPlugin } from './plugin.tsx';

describe('migrations', () => {
  it('should export plugin', () => {
    expect(migrationsPlugin).toBeDefined();
  });
});
