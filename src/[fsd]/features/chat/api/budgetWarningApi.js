import { eliteaApi } from '@/api/eliteaApi';

const apiSlicePath = '/elitea_core/budget_warning';

export const TAG_BUDGET_WARNING = 'TAG_BUDGET_WARNING';

export const budgetWarningApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_BUDGET_WARNING],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Whether a budget is nearing its limit, for the banner above the message input.
      // Intentionally small: the run pages ask on every open, so the backend returns a
      // percentage and nothing else, cached for a minute on its side.
      getBudgetWarning: build.query({
        // feature (e.g. web_search) reads that Tool Spend feature's limits instead of the LLM budget
        query: ({ projectId, feature }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}/budget_warning`,
          params: feature ? { feature } : undefined,
        }),
        providesTags: [TAG_BUDGET_WARNING],
      }),
    }),
  });

export const { useGetBudgetWarningQuery } = budgetWarningApi;
