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
        query: ({ projectId, scope = 'project' }) => ({
          url: `/elitea_core/usage/prompt_lib/${projectId}/usage?scope=${scope}`,
          method: 'GET',
        }),
        providesTags: [TAG_TYPE_USAGE],
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
      usageMembers: build.query({
        // sortBy/sortOrder are wired through to the backend but there's no sort control in
        // UsageMembersTable yet, so callers always get the default: highest spend first
        query: ({ projectId, limit = 10, offset = 0, search, sortBy = 'spend', sortOrder = 'desc' }) => ({
          url: `/elitea_core/user_budgets/prompt_lib/${projectId}`,
          method: 'GET',
          params: {
            limit,
            offset,
            sort_by: sortBy,
            sort_order: sortOrder,
            ...(search ? { search } : {}),
          },
        }),
        providesTags: [TAG_TYPE_USAGE],
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
    }),
  });

export const { useProjectUsageQuery, useUsageMembersQuery, useLazyUsageMembersQuery } = usageApi;
