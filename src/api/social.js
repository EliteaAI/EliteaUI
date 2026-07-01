import { PUBLIC_PROJECT_ID } from '@/common/constants.js';

import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/social';
const TAG_TYPE_USER = 'User';

const PIN_DETAIL_CACHE_BY_ENTITY_TYPE = {
  application: { endpoint: 'applicationDetails', idKey: 'applicationId' },
  toolkit: { endpoint: 'toolkitsDetails', idKey: 'toolkitId' },
  configuration: { endpoint: 'getConfigurationDetail', idKey: 'configId' },
};

const CACHE_KEY_REGEX = /^([a-zA-Z]+)(\{.+\})$/;

function parseCacheKey(cacheKey) {
  const match = cacheKey.match(CACHE_KEY_REGEX);
  if (!match) return null;
  try {
    const args = JSON.parse(match[2]);
    return { endpointName: match[1], args };
  } catch {
    return null;
  }
}

function applyPinToList(list, entityId, shouldPin) {
  const itemIndex = list.findIndex(item => item.id === entityId);
  if (itemIndex === -1) return;
  const [item] = list.splice(itemIndex, 1);
  item.is_pinned = shouldPin;
  if (shouldPin) {
    list.unshift(item);
  } else {
    const lastPinnedIndex = list.findLastIndex(i => i.is_pinned);
    const insertPosition = lastPinnedIndex === -1 ? 0 : lastPinnedIndex + 1;
    list.splice(insertPosition, 0, item);
  }
}

function patchListCachesForPin(state, entityId, shouldPin, dispatch) {
  const patchResults = [];
  Object.entries(state.eliteaApi.queries).forEach(([cacheKey, cacheEntry]) => {
    if (!cacheEntry?.data?.rows && !cacheEntry?.data?.items) return;
    const data = cacheEntry.data;
    const hasEntity =
      data.rows?.some(row => row.id === entityId) || data.items?.some(item => item.id === entityId);
    if (!hasEntity) return;

    const parsed = parseCacheKey(cacheKey);
    if (!parsed) return;

    try {
      const patchResult = dispatch(
        eliteaApi.util.updateQueryData(parsed.endpointName, parsed.args, draft => {
          if (draft?.rows) applyPinToList(draft.rows, entityId, shouldPin);
          else if (draft?.items) applyPinToList(draft.items, entityId, shouldPin);
        }),
      );
      patchResults.push(patchResult);
    } catch {
      // Skip if updateQueryData fails
    }
  });
  return patchResults;
}

function patchDetailCachesForPin(state, projectId, entityType, entityId, shouldPin, dispatch) {
  const detailConfig = PIN_DETAIL_CACHE_BY_ENTITY_TYPE[entityType] ?? null;
  if (!detailConfig) return [];

  const patchResults = [];
  Object.entries(state.eliteaApi.queries).forEach(([cacheKey, cacheEntry]) => {
    if (!cacheKey.startsWith(detailConfig.endpoint) || !cacheEntry?.data) return;
    const argsStr = cacheKey.slice(detailConfig.endpoint.length);
    if (!argsStr.startsWith('{')) return;

    try {
      const args = JSON.parse(argsStr);
      if (String(args[detailConfig.idKey]) !== String(entityId)) return;
      if (projectId != null && args.projectId != null && String(args.projectId) !== String(projectId)) return;

      const patchResult = dispatch(
        eliteaApi.util.updateQueryData(detailConfig.endpoint, args, draft => {
          draft.is_pinned = shouldPin;
        }),
      );
      patchResults.push(patchResult);
    } catch {
      // Skip if args parsing fails
    }
  });
  return patchResults;
}

export const socialApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_USER],
  })
  .injectEndpoints({
    endpoints: build => ({
      authorList: build.query({
        query: ({ projectId, limit, sortBy }) => {
          const params = new URLSearchParams();
          if (limit) params.append('limit', limit);
          if (sortBy) params.append('sort_by', sortBy);
          const queryString = params.toString();
          return {
            url: apiSlicePath + '/authors/' + projectId + (queryString ? '?' + queryString : ''),
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result.map(i => ({ type: TAG_TYPE_USER, id: i.id }));
        },
      }),
      authorDetails: build.query({
        query: () => ({
          url: apiSlicePath + '/author/',
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          const { id } = result;
          // console.log('providesTags result', [
          //   {type: TAG_TYPE_USER, id},
          //   {type: TAG_TYPE_USER, id: 'DETAILS'}
          // ])
          return [
            { type: TAG_TYPE_USER, id },
            { type: TAG_TYPE_USER, id: 'DETAILS' },
          ];
        },
      }),
      authorDescription: build.mutation({
        query: body => {
          return {
            url: apiSlicePath + '/author/',
            method: 'PUT',
            body,
          };
        },
        invalidatesTags: [{ type: TAG_TYPE_USER, id: 'DETAILS' }],
      }),
      feedback: build.mutation({
        query: body => {
          return {
            url: apiSlicePath + '/feedbacks/default/' + PUBLIC_PROJECT_ID,
            method: 'POST',
            body,
          };
        },
      }),
      togglePinItem: build.mutation({
        query: ({ projectId, entityType, entityId, shouldPin }) => {
          return {
            url: `${apiSlicePath}/pin/prompt_lib/${projectId}/${entityType}/${entityId}`,
            method: shouldPin ? 'POST' : 'DELETE',
          };
        },
        async onQueryStarted(
          { projectId, entityType, entityId, shouldPin },
          { dispatch, queryFulfilled, getState },
        ) {
          const state = getState();
          const listPatches = patchListCachesForPin(state, entityId, shouldPin, dispatch);

          const detailPatches = patchDetailCachesForPin(
            state,
            projectId,
            entityType,
            entityId,
            shouldPin,
            dispatch,
          );

          const patchResults = [...listPatches, ...detailPatches];

          try {
            const result = await queryFulfilled;
            const isSuccess = !result.data || result.data?.ok === true;

            if (!isSuccess) {
              patchResults.forEach(patchResult => patchResult.undo());
              throw new Error(shouldPin ? 'Failed to pin item' : 'Failed to unpin item');
            }
          } catch (error) {
            patchResults.forEach(patchResult => patchResult.undo());
            throw error;
          }
        },
      }),
    }),
  });

export const {
  useAuthorListQuery,
  useAuthorDetailsQuery,
  useLazyAuthorDetailsQuery,
  useAuthorDescriptionMutation,
  useFeedbackMutation,
  useTogglePinItemMutation,
} = socialApi;
