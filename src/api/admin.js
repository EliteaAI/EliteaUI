import { PAGE_SIZE } from '@/common/constants.js';
import { removeDuplicateObjects } from '@/common/utils.jsx';

import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/admin';
const TAG_TYPE_USERS = 'TAG_TYPE_USERS';
const TAG_TYPE_ROLES = 'TAG_TYPE_ROLES';
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
    }),
  });

export const {
  useUserListQuery,
  useRoleListQuery,
  useUserCreateMutation,
  useUserUpdateMutation,
  useUserDeleteMutation,
} = apis;
