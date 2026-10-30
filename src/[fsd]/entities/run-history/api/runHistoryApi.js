import { serializeRunHistoryListResponse } from '@/[fsd]/entities/run-history/lib';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE } from '@/common/constants';

export const HISTORY_ITEMS_TAG = 'HISTORY_ITEMS_TAG';
const CONVERSATION_INFO_TAG = 'CONVERSATION_INFO_TAG';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const LIST_TAG = { type: HISTORY_ITEMS_TAG, id: 'LIST' };

const getHistoryEntityName = source => {
  if (source === ParticipantEntityTypes.Toolkit || source === ParticipantEntityTypes.MCP)
    return ParticipantEntityTypes.Toolkit;
  if (source === ParticipantEntityTypes.Skill) return ParticipantEntityTypes.Skill;
  return ParticipantEntityTypes.Application;
};

export const runHistoryApi = eliteaApi
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
            source: source === ParticipantEntityTypes.MCP ? ParticipantEntityTypes.Toolkit : source,
            entity_name: getHistoryEntityName(source),
            entity_meta_id: entityId,
            entity_meta_project_id: entityProjectId,
            limit: pageSize,
            offset: page * pageSize,
            ...params,
          },
        }),
        providesTags: result => [
          LIST_TAG,
          ...(result?.rows ?? []).map(({ id }) => ({ type: HISTORY_ITEMS_TAG, id })),
        ],
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
        invalidatesTags: (_result, _error, { historyId }) => [
          { type: HISTORY_ITEMS_TAG, id: historyId },
          LIST_TAG,
        ],
      }),
      // action is 'approve' or 'reject'; await_task_timeout -1 returns without waiting for the run.
      // A sign-in pause (`mcpAuth` set) resumes with the mcp_auth fields; a sensitive-tool pause with hitl_*.
      decideWaitingRun: build.mutation({
        query: ({ projectId, conversationUuid, messageId, action, mcpAuth }) => ({
          url: `/elitea_core/continue_predict/prompt_lib/${projectId}/${conversationUuid}`,
          method: 'POST',
          body: mcpAuth
            ? {
                message_id: messageId,
                mcp_auth_resume: true,
                mcp_auth_action: action === 'approve' ? 'authorize' : 'skip',
                authorization_request_id: mcpAuth.authorizationRequestId,
                mcp_auth_decisions: [
                  {
                    interrupt_id: mcpAuth.authorizationRequestId,
                    tool_call_id: mcpAuth.toolCallId,
                    child_thread_id: mcpAuth.childThreadId,
                    action: action === 'approve' ? 'authorize' : 'skip',
                    value: '',
                  },
                ],
                // Fresh tokens only for an approval; a rejection needs none
                ...(action === 'approve' && { mcp_tokens: mcpAuth.mcpTokens }),
                await_task_timeout: -1,
              }
            : { message_id: messageId, hitl_resume: true, hitl_action: action, await_task_timeout: -1 },
        }),
        invalidatesTags: [LIST_TAG],
      }),
    }),
  });

export const {
  useGetRunHistoryListQuery,
  useLazyGetRunHistoryListQuery,
  useGetRunHistoryDetailsQuery,
  useLazyGetRunHistoryDetailsQuery,
  useDeleteRunHistoryItemMutation,
  useDecideWaitingRunMutation,
} = runHistoryApi;
