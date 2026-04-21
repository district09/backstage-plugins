import {SchedulerServiceTaskScheduleDefinition} from '@backstage/backend-plugin-api';

export interface Config {
  migrations: {
    /**
     * Frontend root URL
     * @visibility frontend
     */
    schedule: SchedulerServiceTaskScheduleDefinition;
  };
}