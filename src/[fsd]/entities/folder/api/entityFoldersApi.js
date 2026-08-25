import { eliteaApi } from '@/api/eliteaApi';

const apiSlicePath = '/social/folders';
const TAG_TYPE_FOLDER = 'EntityFolder';

/**
 * Regex to parse RTK Query cache keys.
 * Cache keys follow the format: "endpointName{\"arg1\":\"value1\",...}"
 * Example: "applicationList{\"projectId\":123,\"page\":0}"
 */
const CACHE_KEY_REGEX = /^([a-zA-Z]+)(\{.+\})$/;

/**
 * Parses an RTK Query cache key into endpoint name and arguments.
 * Used to identify which cached queries contain a specific entity.
 */
const parseCacheKey = cacheKey => {
  const match = cacheKey.match(CACHE_KEY_REGEX);
  if (!match) return null;
  try {
    const args = JSON.parse(match[2]);
    return { endpointName: match[1], args };
  } catch {
    return null;
  }
};

/**
 * Optimistically updates folder_id/folder_name on an entity across all cached list queries.
 *
 * When moving an entity to/from a folder, we need to update the entity card immediately
 * without waiting for the API response or a full page refresh. This function:
 *
 * 1. Iterates through all RTK Query caches looking for list queries (data.rows or data.items)
 * 2. Finds caches that contain the target entity by ID
 * 3. Patches those caches to update folder_id and folder_name on the entity
 * 4. Returns patch results that can be undone if the API call fails
 *
 * This enables the folder icon to appear/disappear on entity cards instantly.
 */
const patchListCachesForFolder = (state, entityId, folderId, folderName, dispatch) => {
  const patchResults = [];
  Object.entries(state.eliteaApi.queries).forEach(([cacheKey, cacheEntry]) => {
    // Only process list queries that have rows or items arrays
    if (!cacheEntry?.data?.rows && !cacheEntry?.data?.items) return;
    const data = cacheEntry.data;

    // Check if this cache contains the entity we're updating
    const hasEntity =
      data.rows?.some(row => row.id === entityId) || data.items?.some(item => item.id === entityId);
    if (!hasEntity) return;

    const parsed = parseCacheKey(cacheKey);
    if (!parsed) return;

    try {
      // Use RTK Query's updateQueryData for immutable cache updates with undo support
      const patchResult = dispatch(
        eliteaApi.util.updateQueryData(parsed.endpointName, parsed.args, draft => {
          const list = draft?.rows || draft?.items;
          if (!list) return;
          const item = list.find(i => i.id === entityId);
          if (item) {
            item.folder_id = folderId;
            item.folder_name = folderName;
          }
        }),
      );
      patchResults.push(patchResult);
    } catch {
      // Skip if updateQueryData fails (e.g., endpoint doesn't exist)
    }
  });
  return patchResults;
};

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
        // Tag each folder individually + a list tag for bulk invalidation
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
          url: `/social/folder/prompt_lib/${projectId}/${folderId}`,
          method: 'PUT',
          body: { name, meta },
        }),
        invalidatesTags: (_result, _error, { folderId, entityType }) => [
          { type: TAG_TYPE_FOLDER, id: folderId },
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
      removeFolder: build.mutation({
        query: ({ projectId, folderId }) => ({
          url: `/social/folder/prompt_lib/${projectId}/${folderId}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, { folderId, entityType }) => [
          { type: TAG_TYPE_FOLDER, id: folderId },
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
      }),
      moveEntityToFolder: build.mutation({
        query: ({ projectId, folderId, entityType, entityId }) => ({
          url: `/social/move_to_folder/prompt_lib/${projectId}`,
          method: 'PUT',
          body: { entity_type: entityType, entity_id: entityId, folder_id: folderId },
        }),
        // Invalidate folder list to update entity counts
        invalidatesTags: (_result, _error, { entityType }) => [
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
        /**
         * Optimistic update: immediately show folder icon on entity card.
         * Entity lists (applicationList, skillList, etc.) are managed by separate APIs,
         * so we can't use tag invalidation. Instead, we directly patch their caches.
         * If the API call fails, we undo the patches to revert the UI.
         */
        async onQueryStarted({ entityId, folderId, folderName }, { dispatch, queryFulfilled, getState }) {
          const state = getState();
          const patchResults = patchListCachesForFolder(state, entityId, folderId, folderName, dispatch);

          try {
            await queryFulfilled;
          } catch {
            // Revert optimistic updates on failure
            patchResults.forEach(patchResult => patchResult.undo());
          }
        },
      }),
      removeEntityFromFolder: build.mutation({
        query: ({ projectId, entityType, entityId }) => ({
          url: `/social/move_to_folder/prompt_lib/${projectId}`,
          method: 'PUT',
          // Same endpoint as move, but with folder_id: null to remove from folder
          body: { entity_type: entityType, entity_id: entityId, folder_id: null },
        }),
        invalidatesTags: (_result, _error, { entityType }) => [
          { type: TAG_TYPE_FOLDER, id: `LIST_${entityType}` },
        ],
        // Optimistic update: immediately hide folder icon on entity card
        async onQueryStarted({ entityId }, { dispatch, queryFulfilled, getState }) {
          const state = getState();
          const patchResults = patchListCachesForFolder(state, entityId, null, null, dispatch);

          try {
            await queryFulfilled;
          } catch {
            patchResults.forEach(patchResult => patchResult.undo());
          }
        },
      }),
      pinFolder: build.mutation({
        query: ({ projectId, folderId, isPinned }) => ({
          url: `/social/folder/prompt_lib/${projectId}/${folderId}`,
          method: 'PATCH',
          body: { is_pinned: isPinned },
        }),
        invalidatesTags: (_result, _error, { folderId, entityType }) => [
          { type: TAG_TYPE_FOLDER, id: folderId },
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
  useRemoveFolderMutation: useDeleteEntityFolderMutation,
  useMoveEntityToFolderMutation,
  useRemoveEntityFromFolderMutation,
  usePinFolderMutation,
} = entityFoldersApi;
