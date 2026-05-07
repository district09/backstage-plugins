import { CatalogInfoCheckerConfig } from './src/types.ts';

export interface Config {
  migrations: {
    /**
     * various configurations for checks
     * @visibility frontend
     */
    checks?: {
      /**
       * built-in-checks module configuration
       * @visibility frontend
       */
      builtIn?: {
        /**
         * catalog-info.yaml checker configuration
         * @visibility frontend
         */
        catalogInfo?: Array<CatalogInfoCheckerConfig>;
      };
    };
  };
}
