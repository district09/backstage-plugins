import { coreServices } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { CheckSchedulerService } from './services/CheckSchedulerService';
import { MigrationDatabase } from './services/MigrationDatabase';
import {
  ComponentMigrationResult,
  type MigrationResultsResponse,
  SingleComponentMigrationResult,
} from '@district09/backstage-plugin-migrations-common';
import { paginate, parsePaginationParams } from './util.ts';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { stringifyEntityRef } from '@backstage/catalog-model';

export async function createRouter({
  checkSchedulerService,
  dbService,
  logger,
  catalog,
  userInfo,
  httpAuth,
  auth,
}: {
  checkSchedulerService: CheckSchedulerService;
  dbService: MigrationDatabase;
  logger: typeof coreServices.logger.T;
  catalog: CatalogService;
  userInfo: typeof coreServices.userInfo.T;
  httpAuth: typeof coreServices.httpAuth.T;
  auth: typeof coreServices.auth.T;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.post('/refresh/:namespace/:kind/:name', async (req, res) => {
    const { namespace, kind, name } = req.params;
    logger.info(
      `Refreshing checks for ${kind} ${name} in namespace ${namespace}`,
    );
    // Validate the entity reference
    if (!namespace || !kind || !name) {
      throw new InputError('Invalid entity reference provided');
    }
    try {
      await checkSchedulerService.dispatchImmediateCheck({
        name,
        kind,
        namespace,
      });
      res.status(202).json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: (e as Error).message });
    }
  });

  // get results for a migration
  router.get('/results/migration/:namespace/:kind/:name', async (req, res) => {
    logger.info(`Fetching results for ${req.params.kind} ${req.params.name}`);

    let results = await dbService.retrieveResultsFor({
      migrationReference: {
        name: req.params.name,
        kind: req.params.kind,
        namespace: req.params.namespace,
      },
    });

    const credentials = await httpAuth.credentials(req);

    let filteredCatalogItems: string[];
    if (auth.isPrincipal(credentials, 'user') && req.query.filter === 'owned') {
      const info = await userInfo.getUserInfo(credentials);

      const { items } = await catalog.getEntities(
        {
          filter: [{ 'relations.ownedBy': info.ownershipEntityRefs }],
          fields: ['metadata.name', 'kind', 'metadata.namespace'],
        },
        { credentials },
      );
      filteredCatalogItems = items.map(e => stringifyEntityRef(e));
    } else {
      const { items } = await catalog.getEntities(
        {
          fields: ['metadata.name', 'kind', 'metadata.namespace'],
        },
        { credentials },
      );
      filteredCatalogItems = items.map(e => stringifyEntityRef(e));
    }

    results = results.filter(r =>
      filteredCatalogItems.includes(r.componentReference),
    );

    const components: Array<{
      id: string;
      results: Array<ComponentMigrationResult>;
    }> = [];
    const checks: Map<
      string,
      {
        id: string;
        description?: string;
      }
    > = new Map();

    for (const result of results) {
      const existingIndex = components.findIndex(
        c => c.id === result.componentReference,
      );
      const componentResult: ComponentMigrationResult = {
        ...result,
      };
      if (existingIndex < 0) {
        components.push({
          id: result.componentReference,
          results: [componentResult],
        });
      } else {
        components[existingIndex].results.push(componentResult);
      }
      checks.set(result.checkId, {
        id: result.checkId,
        description: result.description,
      });
    }
    let response: MigrationResultsResponse;
    const pagination = parsePaginationParams(req.query);
    if ({ pageSize: 10, offset: 0, ...pagination }.pageSize > 0) {
      const paginatedResponse = paginate(
        components.sort((a, b) => a.id.localeCompare(b.id)),
        { pageSize: 10, offset: 0, ...pagination },
      );
      response = {
        components: paginatedResponse,
        checks: [...checks.values()],
        totalCount: components.length,
      };
    } else {
      response = {
        components: components,
        checks: [...checks.values()],
        totalCount: components.length,
      };
    }

    if (response.components.length === 0) {
      res
        .status(404)
        .send(
          `No results found for ${req.params.namespace}:${req.params.kind}:${req.params.name}`,
        );
    } else {
      res.json(response);
    }
  });
  // get all migration results for a component
  // const url = `${baseUrl}/results/component/${e.namespace || 'default'}/${e.kind}/${e.name}`;
  router.get('/results/component/:namespace/:kind/:name', async (req, res) => {
    logger.info(
      `Fetching results for component ${req.params.kind} ${req.params.name}`,
    );

    const results = await dbService.retrieveResultsForComponent({
      namespace: req.params.namespace,
      kind: req.params.kind,
      name: req.params.name,
    });

    const response: SingleComponentMigrationResult[] = results.map(r => ({
      checkId: r.checkId,
      migrationReference: r.migrationReference,
      result: r.result,
      checked_at: r.checked_at,
    }));

    if (response.length === 0) {
      res
        .status(404)
        .send(
          `No results found for ${req.params.namespace}:${req.params.kind}:${req.params.name}`,
        );
    } else {
      res.json(response);
    }
  });

  return router;
}
