import { eliteaApi } from '@/api';

const TAG_TYPE_USAGE = 'USAGE';
const CACHE_LIFETIME = 60; // Spend aggregates update on LiteLLM's own schedule

export const usageApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_USAGE],
  })
  .injectEndpoints({
    endpoints: build => ({
      projectUsage: build.query({
        query: ({ projectId, scope = 'project', period }) => ({
          url: `/usage/usage/prompt_lib/${projectId}/usage`,
          method: 'GET',
          params: {
            scope,
            ...(period ? { period } : {}),
          },
        }),
        // Cache key must include period so switching months never serves stale data
        serializeQueryArgs: ({ queryArgs }) =>
          `projectUsage-${queryArgs.projectId}-${queryArgs.scope ?? 'project'}-${queryArgs.period ?? 'current'}`,
        providesTags: [TAG_TYPE_USAGE],
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      usageMembers: build.query({
        query: ({
          projectId,
          limit = 10,
          offset = 0,
          search,
          sort_by,
          sort_dir,
          period,
          comparison_period,
        }) => ({
          url: `/elitea_core/user_budgets/prompt_lib/${projectId}`,
          method: 'GET',
          params: {
            limit,
            offset,
            ...(sort_by ? { sort_by, sort_order: sort_dir ?? 'desc' } : {}),
            ...(search ? { search } : {}),
            ...(period ? { period } : {}),
            ...(comparison_period ? { comparison_period } : {}),
          },
        }),
        serializeQueryArgs: ({ queryArgs }) =>
          `usageMembers-${queryArgs.projectId}-${queryArgs.limit}-${queryArgs.offset}-${queryArgs.search ?? ''}-${queryArgs.period ?? 'current'}-${queryArgs.sort_by ?? ''}-${queryArgs.sort_dir ?? ''}-${queryArgs.comparison_period ?? ''}`,
        providesTags: [TAG_TYPE_USAGE],
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
    }),
  });

export const { useProjectUsageQuery, useUsageMembersQuery, useLazyUsageMembersQuery } = usageApi;
