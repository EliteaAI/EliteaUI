import { eliteaApi } from '@/api/eliteaApi';

const apiSlicePath = '/social/folders';
const TAG_TYPE_FOLDER = 'EntityFolder';

export const entityFoldersApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_FOLDER],
  })
  .injectEndpoints({
    endpoints: build => ({
      getFolders: build.query({
        query: ({ projectId, entityType, query, includeCounts = false }) => {
          const params = new URLSearchParams();
          params.append('entity_type', entityType);
          if (query) params.append('query', query);
          if (includeCounts) params.append('include_counts', 'true');
          return {
            url: `${apiSlicePath}/prompt_lib/${projectId}?${params.toString()}`,
          };
        },
        providesTags: (result, _error, { entityType }) => {
          if (!result?.folders) return [{ type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` }];
          return [
            { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
            ...result.folders.map(folder => ({ type: TAG_TYPE_FOLDER, id: folder.id })),
          ];
        },
      }),
      createFolder: build.mutation({
        query: ({ projectId, name, entityType, meta }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}`,
          method: 'POST',
          body: { name, entity_type: entityType, meta },
        }),
        invalidatesTags: (_result, _error, { entityType }) => [
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
      updateFolder: build.mutation({
        query: ({ projectId, folderId, name, meta }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}/${folderId}`,
          method: 'PUT',
          body: { name, meta },
        }),
        invalidatesTags: (_result, _error, { folderId, entityType }) => [
          { type: TAG_TYPE_FOLDER, id: folderId },
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
      deleteFolder: build.mutation({
        query: ({ projectId, folderId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}/${folderId}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, { folderId, entityType }) => [
          { type: TAG_TYPE_FOLDER, id: folderId },
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
      moveEntityToFolder: build.mutation({
        query: ({ projectId, folderId, entityType, entityId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}/${folderId}/move`,
          method: 'POST',
          body: { entity_type: entityType, entity_id: entityId },
        }),
        invalidatesTags: (_result, _error, { entityType }) => [
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
      removeEntityFromFolder: build.mutation({
        query: ({ projectId, entityType, entityId }) => ({
          url: `${apiSlicePath}/prompt_lib/${projectId}/remove`,
          method: 'POST',
          body: { entity_type: entityType, entity_id: entityId },
        }),
        invalidatesTags: (_result, _error, { entityType }) => [
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
    }),
  });

export const {
  useGetFoldersQuery: useGetEntityFoldersQuery,
  useLazyGetFoldersQuery: useLazyGetEntityFoldersQuery,
  useCreateFolderMutation: useCreateEntityFolderMutation,
  useUpdateFolderMutation: useUpdateEntityFolderMutation,
  useDeleteFolderMutation: useDeleteEntityFolderMutation,
  useMoveEntityToFolderMutation,
  useRemoveEntityFromFolderMutation,
} = entityFoldersApi;
