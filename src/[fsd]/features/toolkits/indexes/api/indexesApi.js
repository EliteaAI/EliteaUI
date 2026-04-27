import { alitaApi } from '@/api/alitaApi.js';

const INDEXES_LIST = 'INDEXES_LIST';
const INDEX_SCHEDULE = 'INDEX_SCHEDULE';

const indexesApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: [INDEXES_LIST, INDEX_SCHEDULE],
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
      updateIndexSchedule: build.mutation({
        query: ({ projectId, toolkitId, indexName, timezone, ...body }) => ({
          url: `elitea_core/index_meta/prompt_lib/${projectId}/${toolkitId}/${indexName}`,
          method: 'PATCH',
          body: { ...body, timezone },
        }),
        invalidatesTags: (_, __, { toolkitId }) => [INDEX_SCHEDULE, { type: INDEX_SCHEDULE, id: toolkitId }],
      }),
      getIndexSchedule: build.query({
        query: ({ projectId, toolkitId }) => ({
          url: `elitea_core/tool/prompt_lib/${projectId}/${toolkitId}`,
        }),
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        providesTags: (_, __, { toolkitId }) => [INDEX_SCHEDULE, { type: INDEX_SCHEDULE, id: toolkitId }],
      }),
    }),
  });

export const {
  useGetIndexesListQuery,
  useLazyGetIndexesListQuery,
  useDeleteIndexItemMutation,
  useStopIndexingItemMutation,
  useUpdateIndexScheduleMutation,
  useGetIndexScheduleQuery,
  useLazyGetIndexScheduleQuery,
} = indexesApi;
