import {
  createBackendModule,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import {
  migrationCheckRunnerExtensionPoint,
  type MigrationChecker,
} from '@district09/backstage-plugin-migrations-node';
import { migrationsPlugin } from './plugin';
import { checkSchedulerServiceRef } from './services/CheckSchedulerService';
import { migrationDatabaseServiceRef } from './services/MigrationDatabase';

// ---------------------------------------------------------------------------
// Reusable mock service factories
// ---------------------------------------------------------------------------

const checkSchedulerMockFactory = createServiceFactory({
  service: checkSchedulerServiceRef,
  deps: {},
  async factory() {
    return {
      dispatchImmediateCheck: jest.fn().mockResolvedValue(undefined),
    };
  },
});

const migrationDatabaseMockFactory = createServiceFactory({
  service: migrationDatabaseServiceRef,
  deps: {},
  async factory() {
    return {
      storeMigrationCheck: jest.fn().mockResolvedValue(undefined),
      retrieveResultsFor: jest.fn().mockResolvedValue([]),
      retrieveResultsForComponent: jest.fn().mockResolvedValue([]),
    };
  },
});

const catalogMockFactory = createServiceFactory({
  service: catalogServiceRef,
  deps: {},
  async factory() {
    return {
      getEntities: jest.fn().mockResolvedValue({ items: [] }),
    } as any;
  },
});

const databaseMock = mockServices.database.mock({
  getClient: jest.fn().mockResolvedValue({}),
  migrations: { skip: true },
});

/** Assembles the minimal set of features needed for the plugin to start. */
function baseFeatures() {
  return [
    migrationsPlugin,
    checkSchedulerMockFactory,
    migrationDatabaseMockFactory,
    catalogMockFactory,
    databaseMock.factory,
  ] as const;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('plugin', () => {
  it('should start up without errors using mocked services', async () => {
    const backend = await startTestBackend({ features: [...baseFeatures()] });
    expect(backend).toBeDefined();
    await backend.stop();
  });

  describe('migrationCheckRunnerExtensionPoint', () => {
    it('should allow a checker to be registered via the extension point', async () => {
      const testChecker: MigrationChecker = {
        id: 'my-checker',
        description: 'A test checker',
        runCheckForAllRelatedEntities: jest.fn(),
      };

      const checkerModule = createBackendModule({
        pluginId: 'migrations',
        moduleId: 'test-checker-module',
        register(env) {
          env.registerInit({
            deps: { ep: migrationCheckRunnerExtensionPoint },
            async init({ ep }) {
              ep.addChecker(testChecker);
            },
          });
        },
      });

      // Plugin should start without errors when a valid checker is registered
      const backend = await startTestBackend({
        features: [...baseFeatures(), checkerModule],
      });
      expect(backend).toBeDefined();
      await backend.stop();
    });

    it('should allow multiple checkers with distinct IDs to be registered', async () => {
      const makeChecker = (id: string): MigrationChecker => ({
        id,
        description: `Checker ${id}`,
        runCheckForAllRelatedEntities: jest.fn(),
      });

      const multiCheckerModule = createBackendModule({
        pluginId: 'migrations',
        moduleId: 'test-multi-checker-module',
        register(env) {
          env.registerInit({
            deps: { ep: migrationCheckRunnerExtensionPoint },
            async init({ ep }) {
              ep.addChecker(makeChecker('checker-a'));
              ep.addChecker(makeChecker('checker-b'));
              ep.addChecker(makeChecker('checker-c'));
            },
          });
        },
      });

      const backend = await startTestBackend({
        features: [...baseFeatures(), multiCheckerModule],
      });
      expect(backend).toBeDefined();
      await backend.stop();
    });

    it('should reject a duplicate checker ID and throw an error', async () => {
      const duplicateCheckerModule = createBackendModule({
        pluginId: 'migrations',
        moduleId: 'test-duplicate-checker-module',
        register(env) {
          env.registerInit({
            deps: { ep: migrationCheckRunnerExtensionPoint },
            async init({ ep }) {
              const checker: MigrationChecker = {
                id: 'duplicate-checker',
                description: 'First registration',
                runCheckForAllRelatedEntities: jest.fn(),
              };
              ep.addChecker(checker);
              // Second call with the same ID must throw
              ep.addChecker(checker);
            },
          });
        },
      });

      await expect(
        startTestBackend({
          features: [...baseFeatures(), duplicateCheckerModule],
        }),
      ).rejects.toThrow(
        'Migration checker with id duplicate-checker already exists.',
      );
    });

    it('should reject duplicate checker IDs registered across two separate modules', async () => {
      const makeModule = (moduleId: string, checkerId: string) =>
        createBackendModule({
          pluginId: 'migrations',
          moduleId,
          register(env) {
            env.registerInit({
              deps: { ep: migrationCheckRunnerExtensionPoint },
              async init({ ep }) {
                ep.addChecker({
                  id: checkerId,
                  description: `Checker from ${moduleId}`,
                  runCheckForAllRelatedEntities: jest.fn(),
                });
              },
            });
          },
        });

      const moduleOne = makeModule('module-one', 'shared-checker-id');
      const moduleTwo = makeModule('module-two', 'shared-checker-id');

      await expect(
        startTestBackend({
          features: [...baseFeatures(), moduleOne, moduleTwo],
        }),
      ).rejects.toThrow(
        'Migration checker with id shared-checker-id already exists.',
      );
    });
  });
});
