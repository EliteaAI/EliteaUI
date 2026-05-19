import { eliteaApi } from '@/api';

const TAG_TYPE_CONVERSATION_DETAILS = 'TAG_TYPE_CONVERSATION_DETAILS';

const TAG_TYPE_FOLDERS = 'TAG_TYPE_FOLDERS';
const TAG_TYPE_FOLDER_DETAILS = 'TAG_TYPE_FOLDER_DETAILS';
const TAG_TYPE_TOTAL_FOLDERS = 'TAG_TYPE_TOTAL_FOLDERS';

export { TAG_TYPE_CONVERSATION_DETAILS };

const apiSlicePath = '/elitea_core';
const headers = {
  'Content-Type': 'application/json',
};

export const apiSlice = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_CONVERSATION_DETAILS],
  })
  .injectEndpoints({
    endpoints: build => ({
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
        query: ({ projectId, params }) => ({
          url: apiSlicePath + '/folder/prompt_lib/' + projectId,
          params: {
            ...params,
            grouped: true,
          },
        }),
        providesTags: [TAG_TYPE_FOLDERS],
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const sortedObject = {};
          Object.keys(queryArgs)
            .sort()
            .forEach(prop => {
              sortedObject[prop] = queryArgs[prop];
            });
          return endpointName + JSON.stringify(sortedObject);
        },
        forceRefetch({ currentArg, previousArg }) {
          if (!previousArg) return false;
          return (
            currentArg.projectId !== previousArg.projectId ||
            currentArg.params?.sort_by !== previousArg.params?.sort_by ||
            currentArg.params?.sort_order !== previousArg.params?.sort_order ||
            currentArg.params?.search !== previousArg.params?.search
          );
        },
      }),
      folderConversations: build.query({
        query: ({ projectId, folderId, limit = 10, offset = 0, sort_by, sort_order }) => ({
          url: apiSlicePath + '/folder/prompt_lib/' + projectId,
          params: {
            grouped: true,
            folder_id: folderId,
            limit,
            offset,
            sort_by,
            sort_order,
          },
        }),
      }),
      dateGroupConversations: build.query({
        query: ({ projectId, dateGroup, limit = 10, offset = 0, sort_by, sort_order }) => ({
          url: apiSlicePath + '/folder/prompt_lib/' + projectId,
          params: {
            grouped: true,
            date_group: dateGroup,
            limit,
            offset,
            sort_by,
            sort_order,
          },
        }),
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
    }),
  });

export const {
  useFolderCreateMutation,
  useFoldersListQuery,
  useLazyFolderConversationsQuery,
  useLazyDateGroupConversationsQuery,
  useFolderUpdateMutation,
  useDeleteFolderMutation,
  useFolderPinUpdateMutation,
} = apiSlice;
