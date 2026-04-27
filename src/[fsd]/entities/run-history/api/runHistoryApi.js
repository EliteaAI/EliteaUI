import { RunHistorySerialize } from '@/[fsd]/entities/run-history/lib';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { alitaApi } from '@/api/alitaApi.js';
import { PAGE_SIZE } from '@/common/constants';

const HISTORY_ITEMS_TAG = 'HISTORY_ITEMS_TAG';
const CONVERSATION_INFO_TAG = 'CONVERSATION_INFO_TAG';

const runHistoryApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: [HISTORY_ITEMS_TAG],
  })
  .injectEndpoints({
    endpoints: build => ({
      getRunHistoryList: build.query({
        query: ({ source, projectId, entityId, page = 0, pageSize = PAGE_SIZE, ...params }) => ({
          url: `/elitea_core/conversations/prompt_lib/${projectId}`,
          params: {
            source: source === ParticipantEntityTypes.MCP ? ParticipantEntityTypes.Toolkit : source,
            entity_name:
              source === ParticipantEntityTypes.Toolkit || source === ParticipantEntityTypes.MCP
                ? ParticipantEntityTypes.Toolkit
                : ParticipantEntityTypes.Application,
            entity_meta_id: entityId,
            entity_meta_project_id: projectId,
            limit: pageSize,
            offset: page * pageSize,
            ...params,
          },
        }),
        providesTags: [HISTORY_ITEMS_TAG],
        transformResponse: (response, _, args) =>
          RunHistorySerialize.serializeRunHistoryListResponse(response, args.page > 0),
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
