import { PAGE_SIZE } from '@/common/constants.js';
import { convertToJson, removeDuplicateObjects } from '@/common/utils.jsx';

import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/admin';
const TAG_TYPE_USERS = 'TAG_TYPE_USERS';
const TAG_TYPE_ROLES = 'TAG_TYPE_ROLES';
const TAG_TYPE_MODERATION_STATUS = 'TAG_TYPE_MODERATION_STATUS';
const PROJECT_MODE = 'default';

export const apis = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [],
  })
  .injectEndpoints({
    endpoints: build => ({
      userList: build.query({
        query: ({ projectId, page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/users/' + PROJECT_MODE + '/' + projectId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_USERS];
        },
        transformResponse: (response, meta, args) => {
          return {
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
            currentCache.rows = removeDuplicateObjects([...currentCache.rows, ...newItems.rows]);
          } else {
            // isLoadMore means whether it's starting to fetch page 0,
            // clear cache to avoid duplicate records
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      roleList: build.query({
        query: ({ projectId, page, params, pageSize = PAGE_SIZE }) => ({
          url: apiSlicePath + '/roles/' + PROJECT_MODE + '/' + projectId,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [TAG_TYPE_ROLES];
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
        // Refetch when the page, pageSize ... arg changes
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      userCreate: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/users/' + PROJECT_MODE + '/' + projectId,
            method: 'POST',
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_USERS],
      }),
      userUpdate: build.mutation({
        query: ({ projectId, ...body }) => {
          return {
            url: apiSlicePath + '/users/' + PROJECT_MODE + '/' + projectId,
            method: 'PUT',
            body,
          };
        },
        invalidatesTags: [TAG_TYPE_USERS],
        onQueryStarted: async ({ projectId, id, ids, roles }, { dispatch, getState, queryFulfilled }) => {
          const updatedIds = ids ?? (id != null ? [id] : []);
          const idSet = new Set(updatedIds);
          const {
            eliteaApi: { queries },
          } = getState();
          const patchResults = Object.keys(queries || {})
            .filter(key => {
              if (queries[key].endpointName !== 'userList') return false;
              const args = convertToJson(key.replace('userList', ''));
              return args?.projectId === projectId;
            })
            .map(key =>
              dispatch(
                eliteaApi.util.updateQueryData(
                  'userList',
                  convertToJson(key.replace('userList', '')),
                  draft => {
                    draft.rows?.forEach(row => {
                      if (idSet.has(row.id)) {
                        row.roles = roles;
                      }
                    });
                  },
                ),
              ),
            );
          try {
            await queryFulfilled;
          } catch {
            patchResults.forEach(patch => patch.undo());
          }
        },
      }),
      userDelete: build.mutation({
        query: ({ projectId, params }) => {
          return {
            url: apiSlicePath + '/users/' + PROJECT_MODE + '/' + projectId + '?id[]=' + params.ids.join(','),
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_TYPE_USERS],
      }),
      moderationStatus: build.query({
        query: ({ projectId, entityId }) => ({
          url: apiSlicePath + '/moderation_status/' + PROJECT_MODE + '/' + projectId + '/' + entityId,
        }),
        providesTags: (_, error, { entityId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_MODERATION_STATUS, id: entityId }];
        },
      }),
      createModerationRequest: build.mutation({
        query: ({ projectId, entityId, ...body }) => ({
          url: apiSlicePath + '/moderation_status/' + PROJECT_MODE + '/' + projectId + '/' + entityId,
          method: 'POST',
          body,
        }),
        invalidatesTags: (_, error, { entityId }) => {
          if (error) return [];
          return [{ type: TAG_TYPE_MODERATION_STATUS, id: entityId }];
        },
      }),
    }),
  });

export const {
  useUserListQuery,
  useRoleListQuery,
  useUserCreateMutation,
  useUserUpdateMutation,
  useUserDeleteMutation,
  useModerationStatusQuery,
  useLazyModerationStatusQuery,
  useCreateModerationRequestMutation,
} = apis;
