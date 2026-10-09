import {
  resolveRunHistoryEntityName,
  resolveRunHistorySource,
  serializeRunHistoryListResponse,
} from '@/[fsd]/entities/run-history/lib';
import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE } from '@/common/constants';

const HISTORY_ITEMS_TAG = 'HISTORY_ITEMS_TAG';
const CONVERSATION_INFO_TAG = 'CONVERSATION_INFO_TAG';

const runHistoryApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [HISTORY_ITEMS_TAG],
  })
  .injectEndpoints({
    endpoints: build => ({
      getRunHistoryList: build.query({
        query: ({
          source,
          projectId,
          entityId,
          entityProjectId = projectId,
          page = 0,
          pageSize = PAGE_SIZE,
          ...params
        }) => ({
          url: `/elitea_core/conversations/prompt_lib/${projectId}`,
          params: {
            source: resolveRunHistorySource(source),
            entity_name: resolveRunHistoryEntityName(source),
            entity_meta_id: entityId,
            entity_meta_project_id: entityProjectId,
            limit: pageSize,
            offset: page * pageSize,
            ...params,
          },
        }),
        providesTags: [HISTORY_ITEMS_TAG],
        transformResponse: (response, _, args) => serializeRunHistoryListResponse(response, args.page > 0),
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      getRunHistoryDetails: build.query({
        query: ({ projectId, conversationId }) => ({
          url: `/elitea_core/conversation/prompt_lib/${projectId}/${conversationId}`,
        }),
        providesTags: [CONVERSATION_INFO_TAG],
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      deleteRunHistoryItem: build.mutation({
        query: ({ projectId, historyId }) => ({
          url: `/elitea_core/conversation/prompt_lib/${projectId}/${historyId}`,
          method: 'PUT',
          body: {
            is_hidden: true,
          },
        }),
        invalidatesTags: [HISTORY_ITEMS_TAG],
      }),
    }),
  });

export const {
  useGetRunHistoryListQuery,
  useLazyGetRunHistoryListQuery,
  useGetRunHistoryDetailsQuery,
  useLazyGetRunHistoryDetailsQuery,
  useDeleteRunHistoryItemMutation,
} = runHistoryApi;
