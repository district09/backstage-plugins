import {
  createServiceFactory,
  createServiceRef,
  ServiceFactory,
  ServiceRef,
} from '@backstage/backend-plugin-api';
import {
  CheckerStoreService,
  MigrationChecker,
} from '@district09/backstage-plugin-migrations-node';

export class DefaultCheckerStoreService implements CheckerStoreService {
  private checkers: Map<string, MigrationChecker> = new Map<
    string,
    MigrationChecker
  >();

  addChecker(checker: MigrationChecker): void {
    if (this.checkers.has(checker.id)) {
      throw new Error(
        `Migration checker with id ${checker.id} already exists.`,
      );
    }
    this.checkers.set(checker.id, checker);
  }

  getCheckers(): Map<string, MigrationChecker> {
    return this.checkers;
  }

  getChecker(id: string): MigrationChecker | undefined {
    return this.checkers.get(id);
  }
}

export const checkerStoreServiceRef = createServiceRef<CheckerStoreService>({
  id: 'migrations.checkerStore',
  async defaultFactory(
    service: ServiceRef<CheckerStoreService, 'plugin'>,
  ): Promise<ServiceFactory> {
    return createServiceFactory({
      service,
      deps: {},
      async factory() {
        return new DefaultCheckerStoreService();
      },
    });
  },
});
