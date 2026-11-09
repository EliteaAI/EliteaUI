import { eliteaApi } from '@/api/eliteaApi.js';

const INDEXES_LIST = 'INDEXES_LIST';

const indexesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [INDEXES_LIST],
  })
  .injectEndpoints({
    endpoints: build => ({
      getIndexesList: build.query({
        query: ({ toolkitId, projectId }) => ({
          url: `elitea_core/index_meta/prompt_lib/${projectId}/${toolkitId}`,
        }),
        providesTags: [INDEXES_LIST],
        forceRefetch({ currentArg, previousArg, endpointState }) {
          if (endpointState?.skip) return false;

          return currentArg !== previousArg;
        },
      }),
      deleteIndexItem: build.mutation({
        query: ({ projectId, toolkitId, indexId }) => ({
          url: `elitea_core/index_meta/prompt_lib/${projectId}/${toolkitId}/${indexId}`,
          method: 'DELETE',
          body: {
            is_hidden: true,
          },
        }),
        invalidatesTags: [INDEXES_LIST],
      }),
      stopIndexingItem: build.mutation({
        query: ({ projectId, toolkitId, indexName, taskId }) => ({
          url: `elitea_core/index_cancel/prompt_lib/${projectId}/${toolkitId}/${indexName}/${taskId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [INDEXES_LIST],
      }),
      saveIndexConfiguration: build.mutation({
        query: ({ projectId, toolkitId, indexName, configuration }) => ({
          url: `elitea_core/index_config/prompt_lib/${projectId}/${toolkitId}/${indexName}`,
          method: 'PUT',
          body: { configuration },
        }),
        invalidatesTags: [INDEXES_LIST],
      }),
    }),
  });

export const invalidateIndexesList = () => indexesApi.util.invalidateTags([INDEXES_LIST]);

export const {
  useGetIndexesListQuery,
  useLazyGetIndexesListQuery,
  useDeleteIndexItemMutation,
  useStopIndexingItemMutation,
  useSaveIndexConfigurationMutation,
} = indexesApi;
