import { PAGE_SIZE } from '@/common/constants';
import { removeDuplicateObjects } from '@/common/utils.jsx';

import { alitaApi } from './alitaApi.js';

const TAG_TYPE_CONVERSATIONS = 'TAG_TYPE_CONVERSATIONS';
const TAG_TYPE_CONVERSATION_DETAILS = 'TAG_TYPE_CONVERSATION_DETAILS';
const TAG_TYPE_TOTAL_CONVERSATIONS = 'TAG_TYPE_TOTAL_CONVERSATIONS';
const TAG_TYPE_MESSAGES = 'TAG_TYPE_MESSAGES';
const TAG_TYPE_FOLDERS = 'TAG_TYPE_FOLDERS';
const TAG_TYPE_FOLDER_DETAILS = 'TAG_TYPE_FOLDER_DETAILS';
const TAG_TYPE_TOTAL_FOLDERS = 'TAG_TYPE_TOTAL_FOLDERS';
const TAG_TYPE_CANVAS_DETAILS = 'TAG_TYPE_CANVAS_DETAILS';

export { TAG_TYPE_CONVERSATION_DETAILS };

const apiSlicePath = '/elitea_core';
const headers = {
  'Content-Type': 'application/json',
};

export const apiSlice = alitaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_CONVERSATION_DETAILS],
  })
  .injectEndpoints({
    endpoints: build => ({
      conversationList: build.query({
        query: ({ projectId, page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/conversations/prompt_lib/' + projectId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_CONVERSATIONS],
        transformResponse: (response, meta, args) => {
          return Array.isArray(response)
            ? {
                rows: [...response],
                isLoadMore: args.page > 0,
              }
            : {
                ...response,
                isLoadMore: args.page > 0,
              };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([
              ...currentCache.rows,
              ...(newItems.rows ?? newItems),
            ]);
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.rows = newItems.rows ? newItems.rows : newItems;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      messageList: build.query({
        query: ({ projectId, conversationId, page, params, pageSize = 10 }) => ({
          url: apiSlicePath + '/messages/prompt_lib/' + projectId + '/' + conversationId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_MESSAGES],
        transformResponse: (response, meta, args) => {
          return Array.isArray(response)
            ? {
                rows: [...response],
                isLoadMore: args.page > 1,
              }
            : {
                ...response,
                isLoadMore: args.page > 1,
              };
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows = removeDuplicateObjects([
              ...currentCache.rows,
              ...(newItems.rows ?? newItems),
            ]);
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.rows = newItems.rows ? newItems.rows : newItems;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      deleteMessageFromConversation: build.mutation({
        // eslint-disable-next-line no-unused-vars
        query: ({ projectId, id, conversationId: _conversationId }) => {
          return {
            url: apiSlicePath + '/message/prompt_lib/' + projectId + '/' + id,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),
      deleteAllMessagesFromConversation: build.mutation({
        query: ({ projectId, conversationId }) => {
          return {
            url: apiSlicePath + '/messages/prompt_lib/' + projectId + '/' + conversationId,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),
      conversationCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/conversations/prompt_lib/' + projectId,
            method: 'POST',
            headers,
            body,
          };
        },
      }),
      conversationEdit: build.mutation({
        query: ({ projectId, id, ...body }) => {
          return {
            url: apiSlicePath + '/conversation/prompt_lib/' + projectId + '/' + id,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: result?.id }];
        },
      }),
      addParticipantIntoConversation: build.mutation({
        query: ({ projectId, id, participants }) => {
          return {
            url: apiSlicePath + '/participants/prompt_lib/' + projectId + '/' + id,
            method: 'POST',
            headers,
            body: participants,
          };
        },
        invalidatesTags: (result, error, { id }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id }];
        },
      }),
      deleteParticipantFromConversation: build.mutation({
        query: ({ projectId, conversationId, id }) => {
          return {
            url: apiSlicePath + '/participant/prompt_lib/' + projectId + '/' + conversationId + '/' + id,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),
      updateParticipantSettings: build.mutation({
        query: ({ projectId, conversationId, participantId, ...body }) => {
          return {
            url:
              apiSlicePath +
              '/entity_settings/prompt_lib/' +
              projectId +
              '/' +
              conversationId +
              '/' +
              participantId,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      updateParticipantLlmSettings: build.mutation({
        query: ({ projectId, conversationId, llm_settings }) => {
          return {
            url: apiSlicePath + '/entity_settings/prompt_lib/' + projectId + '/' + conversationId,
            method: 'PATCH',
            headers,
            body: { llm_settings },
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),
      deleteConversation: build.mutation({
        query: ({ projectId, id }) => {
          return {
            url: apiSlicePath + '/conversations/prompt_lib/' + projectId + '/' + id,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_CONVERSATIONS, TAG_TYPE_CONVERSATIONS],
      }),
      stopChatTask: build.mutation({
        query: ({ projectId, messageGroupUuid }) => ({
          url: apiSlicePath + '/task/prompt_lib/' + projectId + '/' + messageGroupUuid,
          method: 'DELETE',
        }),
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
      }),
      conversationDetails: build.query({
        query: ({ projectId, id }) => {
          const url = apiSlicePath + '/conversation/prompt_lib/' + projectId + '/' + id;
          return {
            url,
          };
        },
        providesTags: (result, error, { id: conversationId }) => {
          if (error) {
            return [];
          }
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),
      regenerate: build.mutation({
        query: ({ projectId, id, ...body }) => {
          return {
            url: apiSlicePath + '/regenerate/prompt_lib/' + projectId + '/' + id,
            method: 'POST',
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_CONVERSATIONS, TAG_TYPE_CONVERSATIONS],
      }),

      folderCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/folder/prompt_lib/' + projectId,
            method: 'POST',
            headers,
            body,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_FOLDER_DETAILS, { type: TAG_TYPE_FOLDER_DETAILS, id: result?.id }];
        },
        invalidatesTags: [TAG_TYPE_TOTAL_FOLDERS, TAG_TYPE_FOLDERS],
        transformResponse: response => {
          // Transform the response to add an empty conversations array
          return {
            ...response, // Retain all existing properties
            conversations: [], // Add conversations as an empty array
          };
        },
      }),

      foldersList: build.query({
        query: ({ projectId, page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/folder/prompt_lib/' + projectId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [TAG_TYPE_FOLDERS],
        transformResponse: (response, meta, args) => ({
          ...response,
          isLoadMore: args.page > 0,
        }),
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .filter(prop => prop !== 'page')
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        // merge new page data into existing cache
        // merge: (currentCache, newItems) => {
        //   if (newItems.isLoadMore) {
        //     currentCache.rows = removeDuplicateObjects([
        //       ...currentCache.rows,
        //       ...(newItems.rows ?? newItems),
        //     ]);
        //   } else {
        //     // isLoadMore means whether it's starting to fetch page 0,
        //     // clear cache to avoid duplicate records
        //     currentCache.rows = newItems.rows ? newItems.rows : newItems;
        //     currentCache.total = newItems.total;
        //   }
        // },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),

      folderUpdate: build.mutation({
        query: ({ projectId, id, ...body }) => {
          return {
            url: apiSlicePath + '/folder/prompt_lib/' + projectId + '/' + id,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [
            { type: TAG_TYPE_FOLDER_DETAILS, id: result?.id },
            TAG_TYPE_FOLDER_DETAILS,
            TAG_TYPE_FOLDERS,
          ];
        },
      }),

      deleteFolder: build.mutation({
        query: ({ projectId, id }) => {
          return {
            url: apiSlicePath + '/folder/prompt_lib/' + projectId + '/' + id,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_TOTAL_FOLDERS, TAG_TYPE_FOLDERS],
      }),

      folderPinUpdate: build.mutation({
        query: ({ projectId, id, is_pinned }) => {
          return {
            url: apiSlicePath + '/folder/prompt_lib/' + projectId + '/' + id,
            method: 'PATCH',
            headers,
            body: { is_pinned },
          };
        },
        invalidatesTags: [],
      }),

      selectConversation: build.mutation({
        query: ({ projectId, conversationId }) => {
          return {
            url: apiSlicePath + '/select_conversation/prompt_lib/' + projectId + '/' + conversationId,
            method: 'POST',
            headers,
            body: {},
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [];
        },
        invalidatesTags: [],
      }),
      unselectConversation: build.mutation({
        query: ({ projectId }) => {
          return {
            url: apiSlicePath + '/select_conversation/prompt_lib/' + projectId,
            method: 'DELETE',
            headers,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [];
        },
        invalidatesTags: [],
      }),
      createCanvas: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/canvases/prompt_lib/' + projectId,
            method: 'POST',
            headers,
            body,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [];
        },
        invalidatesTags: [],
        transformResponse: response => {
          // Transform the response to add an empty conversations array
          return {
            ...response, // Retain all existing properties
            conversations: [], // Add conversations as an empty array
          };
        },
      }),
      editCanvas: build.mutation({
        query: ({ projectId, canvasUUID, ...body }) => {
          return {
            url: apiSlicePath + '/canvas/prompt_lib/' + projectId + '/' + canvasUUID,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CANVAS_DETAILS, id: result?.id }, TAG_TYPE_CANVAS_DETAILS];
        },
      }),

      // Context Management APIs
      getContextStatus: build.query({
        query: ({ projectId, conversationId }) => ({
          url: `/elitea_core/context_analytics/prompt_lib/${projectId}/${conversationId}`,
          method: 'GET',
        }),
        providesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      updateContextStrategy: build.mutation({
        query: ({ projectId, conversationId, ...body }) => {
          return {
            url: `/elitea_core/context_strategy/prompt_lib/${projectId}/${conversationId}`,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      optimizeContext: build.mutation({
        query: ({ projectId, conversationId, ...body }) => {
          return {
            url: `/context_manager/optimize_context/${projectId}/${conversationId}`,
            method: 'POST',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      getContextAnalytics: build.query({
        query: ({ projectId, conversationId }) => ({
          url: `/context_manager/analytics/${projectId}/${conversationId}`,
          method: 'GET',
        }),
        providesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      // Summary Management APIs
      generateSummary: build.mutation({
        query: ({ projectId, conversationId, ...body }) => {
          return {
            url: `/context_manager/summaries/${projectId}/${conversationId}`,
            method: 'POST',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      getConversationSummaries: build.query({
        query: ({ projectId, conversationId, limit = 10, offset = 0 }) => ({
          url: `/context_manager/summaries/${projectId}/${conversationId}`,
          method: 'GET',
          params: { limit, offset },
        }),
        providesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          // eslint-disable-next-line no-unused-vars
          const { offset, ...rest } = queryArgs;
          return endpointName + JSON.stringify(rest);
        },
        merge: (currentCache, newItems, { arg }) => {
          if (arg.offset > 0) {
            return {
              ...newItems,
              summaries: [...(currentCache.summaries || []), ...(newItems.summaries || [])],
            };
          }
          return newItems;
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg?.offset !== previousArg?.offset;
        },
      }),

      updateSummary: build.mutation({
        query: ({ projectId, conversationId, summaryId, ...body }) => {
          return {
            url: `/context_manager/summary/${projectId}/${conversationId}/${summaryId}`,
            method: 'PUT',
            headers,
            body,
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      deleteSummary: build.mutation({
        query: ({ projectId, conversationId, summaryId }) => {
          return {
            url: `/context_manager/summary/${projectId}/${conversationId}/${summaryId}`,
            method: 'DELETE',
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      canvasDetails: build.query({
        query: ({ projectId, id }) => {
          const url = apiSlicePath + '/canvas/prompt_lib/' + projectId + '/' + id;
          return {
            url,
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_CANVAS_DETAILS, { type: TAG_TYPE_CANVAS_DETAILS, id: result?.id }];
        },
        // Only keep one cacheEntry marked by the query's endpointName
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
      }),

      setAttachmentStorage: build.mutation({
        query: ({ projectId, conversationId, toolkit_id }) => {
          return {
            url: apiSlicePath + '/attachment_storage/prompt_lib/' + projectId + '/' + conversationId,
            method: 'PUT',
            body: { toolkit_id },
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),

      uploadAttachments: build.mutation({
        query: ({ projectId, conversationId, attachments }) => {
          const form = new FormData();
          if (attachments?.length) {
            for (let i = 0; i < attachments.length; i++) {
              form.append('file', attachments[i]);
            }
          }
          form.append('overwrite_attachments', 1);
          return {
            url: apiSlicePath + '/attachments/prompt_lib/' + projectId + '/' + conversationId,
            method: 'POST',
            body: form,
            formData: true,
          };
        },
        invalidatesTags: (result, error) => {
          if (error) return [];
          return [];
        },
      }),

      removeAttachments: build.mutation({
        query: ({ projectId, conversationId, attachments, keep_in_storage }) => {
          // Build query parameters for multiple attachment values
          const params = new URLSearchParams();

          // Add each attachment as a separate 'attachment' parameter
          if (Array.isArray(attachments)) {
            attachments.forEach(attachment => {
              params.append('filename', attachment.name);
            });
          } else if (attachments) {
            // Handle single filename case
            params.append('filename', attachments);
          }
          params.append('keep_in_storage', keep_in_storage ? 1 : 0);
          return {
            url: `${apiSlicePath}/attachments/prompt_lib/${projectId}/${conversationId}`,
            method: 'DELETE',
            params: Object.fromEntries(params.entries()),
          };
        },
        invalidatesTags: (result, error, { conversationId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_CONVERSATION_DETAILS, id: conversationId }];
        },
      }),
    }),
  });

export const {
  useConversationListQuery,
  useLazyConversationListQuery,
  useConversationCreateMutation,
  useConversationEditMutation,
  useConversationDetailsQuery,
  useLazyConversationDetailsQuery,
  useDeleteConversationMutation,
  useAddParticipantIntoConversationMutation,
  useDeleteParticipantFromConversationMutation,
  useUpdateParticipantSettingsMutation,
  useLazyMessageListQuery,
  useDeleteMessageFromConversationMutation,
  useDeleteAllMessagesFromConversationMutation,
  useRegenerateMutation,
  useFolderCreateMutation,
  useFoldersListQuery,
  useFolderUpdateMutation,
  useDeleteFolderMutation,
  useFolderPinUpdateMutation,
  useSelectConversationMutation,
  useUnselectConversationMutation,
  useCreateCanvasMutation,
  useCanvasDetailsQuery,
  useEditCanvasMutation,
  useStopChatTaskMutation,
  useUpdateParticipantLlmSettingsMutation,
  // Context Management hooks
  useGetContextStatusQuery,
  useLazyGetContextStatusQuery,
  useUpdateContextStrategyMutation,
  useOptimizeContextMutation,
  useGetContextAnalyticsQuery,
  useLazyGetContextAnalyticsQuery,
  // Summary Management hooks
  useGenerateSummaryMutation,
  useGetConversationSummariesQuery,
  useLazyGetConversationSummariesQuery,
  useUpdateSummaryMutation,
  useDeleteSummaryMutation,
  useSetAttachmentStorageMutation,
  useUploadAttachmentsMutation,
  useRemoveAttachmentsMutation,
} = apiSlice;
