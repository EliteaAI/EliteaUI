import { eliteaApi } from '@/api/eliteaApi.js';

const INDEXES_LIST = 'INDEXES_LIST';
const INDEX_SCHEDULE = 'INDEX_SCHEDULE';
const INDEX_EXECUTION_CONTRACT = 'index.ingest.v1';

const indexesApi = eliteaApi
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
      startIndexData: build.mutation({
        query: ({ projectId, ...body }) => ({
          // This discriminator is routing metadata, not authorization. It lets
          // the hybrid gateway move only async index_data to Go while every
          // other toolkit tool on the shared current endpoint stays on Python.
          url:
            `elitea_core/test_toolkit_tool/prompt_lib/${projectId}` +
            `?await_response=false&execution_contract=${INDEX_EXECUTION_CONTRACT}`,
          method: 'POST',
          body,
        }),
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
      deleteIndexSchedule: build.mutation({
        query: ({ projectId, toolkitId, indexName, userId }) => ({
          url: `elitea_core/index_schedule/prompt_lib/${projectId}/${toolkitId}/${indexName}${userId != null ? `?user_id=${userId}` : ''}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_, __, { toolkitId }) => [INDEX_SCHEDULE, { type: INDEX_SCHEDULE, id: toolkitId }],
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
  useStartIndexDataMutation,
  useDeleteIndexItemMutation,
  useStopIndexingItemMutation,
  useDeleteIndexScheduleMutation,
  useUpdateIndexScheduleMutation,
  useGetIndexScheduleQuery,
  useLazyGetIndexScheduleQuery,
} = indexesApi;
