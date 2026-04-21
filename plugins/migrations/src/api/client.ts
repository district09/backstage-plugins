import { MigrationsApi } from './types.ts';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import {
  CompoundEntityRef,
  getCompoundEntityRef,
} from '@backstage/catalog-model';
import {
  MigrationEntityV1,
  MigrationResultsResponse,
  SingleComponentMigrationResult,
} from '@district09/backstage-plugin-migrations-common';

export class MigrationClient implements MigrationsApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  async getMigrationResultsByRef(
    migration: CompoundEntityRef,
    params: {
      offset?: number;
      pageSize?: number;
      search?: string;
      signal?: AbortSignal;
      filter?: string;
    },
  ) {
    const baseUrl = await this.discoveryApi.getBaseUrl('migrations');
    const url = `${baseUrl}/results/migration/${
      migration.namespace || 'default'
    }/${migration.kind}/${migration.name}?offset=${params.offset}&pageSize=${
      params.pageSize
    }&search=${params.search}&filter=${params.filter}`;
    return await this.fetch<MigrationResultsResponse>(url, {
      method: 'GET',
      signal: params.signal,
    });
  }

  async getComponentResults(
    e: CompoundEntityRef,
  ): Promise<SingleComponentMigrationResult[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('migrations');
    const url = `${baseUrl}/results/component/${e.namespace || 'default'}/${
      e.kind
    }/${e.name}`;
    return await this.fetch<SingleComponentMigrationResult[]>(url, {
      method: 'GET',
    });
  }

  async getMigrationResults(
    migration: MigrationEntityV1,
    params: {
      offset?: number;
      pageSize?: number;
      search?: string;
      signal?: AbortSignal;
    },
  ): Promise<MigrationResultsResponse> {
    return await this.getMigrationResultsByRef(
      getCompoundEntityRef(migration),
      params,
    );
  }

  private async fetch<T = any>(input: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchApi.fetch(input, init);
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  }

  async refreshMigration(
    migration: MigrationEntityV1,
  ): Promise<{ success: boolean }> {
    const baseUrl = await this.discoveryApi.getBaseUrl('migrations');
    const url = `${baseUrl}/refresh/${
      migration.metadata.namespace || 'default'
    }/${migration.kind}/${migration.metadata.name}`;
    return await this.fetch<{ success: boolean }>(url, { method: 'POST' });
  }
}
