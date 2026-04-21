import request from 'supertest';
import express from 'express';
import { mockServices, mockCredentials } from '@backstage/backend-test-utils';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import { createRouter } from './router';
import type { CheckSchedulerService } from './services/CheckSchedulerService';
import type { MigrationDatabase } from './services/MigrationDatabase';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

describe('createRouter', () => {
  let app: express.Express;

  const mockCheckScheduler: jest.Mocked<CheckSchedulerService> = {
    dispatchImmediateCheck: jest.fn(),
  };

  const mockDb: jest.Mocked<MigrationDatabase> = {
    storeMigrationCheck: jest.fn(),
    retrieveResultsFor: jest.fn(),
    retrieveResultsForComponent: jest.fn(),
  };

  const mockCatalog = {
    getEntities: jest.fn(),
  } as unknown as jest.Mocked<CatalogService>;

  const mockHttpAuth = mockServices.httpAuth.mock();
  const mockAuth = mockServices.auth.mock();
  const mockUserInfo = mockServices.userInfo.mock();

  beforeEach(async () => {
    jest.clearAllMocks();

    mockHttpAuth.credentials.mockResolvedValue(mockCredentials.service());
    (mockAuth.isPrincipal as unknown as jest.Mock).mockReturnValue(false);
    (mockCatalog.getEntities as jest.Mock).mockResolvedValue({ items: [] });

    const router = await createRouter({
      checkSchedulerService: mockCheckScheduler,
      dbService: mockDb,
      catalog: mockCatalog,
      userInfo: mockUserInfo,
      httpAuth: mockHttpAuth,
      auth: mockAuth,
      logger: mockLogger as any,
    });

    app = express();
    app.use(router);
  });

  describe('POST /refresh/:namespace/:kind/:name', () => {
    it('returns 202 on successful dispatch', async () => {
      mockCheckScheduler.dispatchImmediateCheck.mockResolvedValue(undefined);

      const res = await request(app).post(
        '/refresh/default/Component/my-service',
      );

      expect(res.status).toBe(202);
      expect(res.body).toEqual({ success: true });
      expect(mockCheckScheduler.dispatchImmediateCheck).toHaveBeenCalledWith({
        name: 'my-service',
        kind: 'Component',
        namespace: 'default',
      });
    });

    it('returns 500 when dispatchImmediateCheck throws', async () => {
      mockCheckScheduler.dispatchImmediateCheck.mockRejectedValue(
        new Error('Scheduler unavailable'),
      );

      const res = await request(app).post(
        '/refresh/default/Component/my-service',
      );

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        success: false,
        message: 'Scheduler unavailable',
      });
    });
  });

  describe('GET /results/migration/:namespace/:kind/:name', () => {
    it('returns 404 when no results match catalog entities', async () => {
      mockDb.retrieveResultsFor.mockResolvedValue([
        {
          checkId: 'check-1',
          result: true,
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/my-component',
        },
      ]);

      // Catalog returns a different entity so the DB result is filtered out
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'other-component', namespace: 'default' },
          },
        ],
      });

      const res = await request(app).get(
        '/results/migration/default/Migration/my-migration',
      );

      expect(res.status).toBe(404);
    });

    it('returns 200 with correctly shaped results when entities match', async () => {
      mockDb.retrieveResultsFor.mockResolvedValue([
        {
          checkId: 'check-1',
          description: 'Checks something important',
          result: true,
          checked_at: '2024-01-01T00:00:00.000Z',
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/my-component',
        },
      ]);

      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'my-component', namespace: 'default' },
          },
        ],
      });

      const res = await request(app).get(
        '/results/migration/default/Migration/my-migration',
      );

      expect(res.status).toBe(200);
      expect(res.body.totalCount).toBe(1);
      expect(res.body.components).toHaveLength(1);
      expect(res.body.components[0].id).toBe('component:default/my-component');
      expect(res.body.components[0].results).toHaveLength(1);
      expect(res.body.components[0].results[0]).toMatchObject({
        checkId: 'check-1',
        result: true,
        checked_at: '2024-01-01T00:00:00.000Z',
      });
      expect(res.body.checks).toEqual([
        { id: 'check-1', description: 'Checks something important' },
      ]);
    });

    it('filters by ownership when ?filter=owned and caller is a user principal', async () => {
      mockHttpAuth.credentials.mockResolvedValue(mockCredentials.user());
      (mockAuth.isPrincipal as unknown as jest.Mock).mockReturnValue(true);
      mockUserInfo.getUserInfo.mockResolvedValue({
        userEntityRef: 'user:default/mock',
        ownershipEntityRefs: ['user:default/mock', 'group:default/my-team'],
      });

      mockDb.retrieveResultsFor.mockResolvedValue([
        {
          checkId: 'check-1',
          result: true,
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/owned-component',
        },
        {
          checkId: 'check-1',
          result: false,
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/not-owned-component',
        },
      ]);

      // Catalog returns only the owned component when queried with the ownership filter
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'owned-component', namespace: 'default' },
          },
        ],
      });

      const res = await request(app)
        .get('/results/migration/default/Migration/my-migration')
        .query({ filter: 'owned' });

      expect(res.status).toBe(200);
      expect(res.body.totalCount).toBe(1);
      expect(res.body.components).toHaveLength(1);
      expect(res.body.components[0].id).toBe(
        'component:default/owned-component',
      );

      expect(mockCatalog.getEntities).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: [
            {
              'relations.ownedBy': [
                'user:default/mock',
                'group:default/my-team',
              ],
            },
          ],
        }),
        expect.anything(),
      );
    });

    it('paginates results correctly with ?pageSize=1&offset=0', async () => {
      mockDb.retrieveResultsFor.mockResolvedValue([
        {
          checkId: 'check-1',
          result: true,
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/alpha-component',
        },
        {
          checkId: 'check-1',
          result: false,
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/beta-component',
        },
      ]);

      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'alpha-component', namespace: 'default' },
          },
          {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'beta-component', namespace: 'default' },
          },
        ],
      });

      const res = await request(app)
        .get('/results/migration/default/Migration/my-migration')
        .query({ pageSize: 1, offset: 0 });

      expect(res.status).toBe(200);
      // totalCount reflects all components before pagination
      expect(res.body.totalCount).toBe(2);
      // Only one component is returned due to pageSize=1
      expect(res.body.components).toHaveLength(1);
      // Components are sorted alphabetically, so alpha comes first
      expect(res.body.components[0].id).toBe(
        'component:default/alpha-component',
      );
    });
  });

  describe('GET /results/component/:namespace/:kind/:name', () => {
    it('returns 404 when no results are found for the component', async () => {
      mockDb.retrieveResultsForComponent.mockResolvedValue([]);

      const res = await request(app).get(
        '/results/component/default/Component/my-service',
      );

      expect(res.status).toBe(404);
      expect(mockDb.retrieveResultsForComponent).toHaveBeenCalledWith({
        namespace: 'default',
        kind: 'Component',
        name: 'my-service',
      });
    });

    it('returns 200 with results when the component has check results', async () => {
      mockDb.retrieveResultsForComponent.mockResolvedValue([
        {
          checkId: 'check-1',
          result: true,
          checked_at: '2024-06-01T12:00:00.000Z',
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/my-service',
        },
        {
          checkId: 'check-2',
          result: false,
          checked_at: '2024-06-01T12:00:00.000Z',
          migrationReference: 'migration:default/my-migration',
          componentReference: 'component:default/my-service',
        },
      ]);

      const res = await request(app).get(
        '/results/component/default/Component/my-service',
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        checkId: 'check-1',
        result: true,
        checked_at: '2024-06-01T12:00:00.000Z',
        migrationReference: 'migration:default/my-migration',
      });
      expect(res.body[1]).toMatchObject({
        checkId: 'check-2',
        result: false,
        migrationReference: 'migration:default/my-migration',
      });
      expect(mockDb.retrieveResultsForComponent).toHaveBeenCalledWith({
        namespace: 'default',
        kind: 'Component',
        name: 'my-service',
      });
    });
  });
});
