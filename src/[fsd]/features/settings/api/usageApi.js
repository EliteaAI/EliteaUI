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
        query: ({ projectId }) => ({
          url: `/elitea_core/user_budgets/prompt_lib/${projectId}`,
          method: 'GET',
        }),
        keepUnusedDataFor: CACHE_LIFETIME,
      }),
    }),
  });

export const { useProjectUsageQuery, useUsageMembersQuery } = usageApi;
