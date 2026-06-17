import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/elitea_core/agent_categories';

export const TAG_AGENT_CATEGORIES = 'TAG_AGENT_CATEGORIES';

export const agentCategoriesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_AGENT_CATEGORIES],
  })
  .injectEndpoints({
    endpoints: build => ({
      getAgentCategories: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}`,
        }),
        providesTags: [TAG_AGENT_CATEGORIES],
      }),
    }),
  });

export const { useGetAgentCategoriesQuery, useLazyGetAgentCategoriesQuery } = agentCategoriesApi;
