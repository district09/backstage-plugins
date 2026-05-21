export interface EntityRefreshService {
  refreshEntity(repoSlug: string): Promise<void>;
}
