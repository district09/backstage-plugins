import { CompoundEntityRef } from '@backstage/catalog-model';

export interface CheckSchedulerService {
  dispatchImmediateCheck(input: CompoundEntityRef): Promise<void>;
  dispatchImmediateEntityCheck(entityRef: CompoundEntityRef): Promise<void>;
}
