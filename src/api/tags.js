import { CollectionStatus, PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';

import { eliteaApi } from './eliteaApi.js';

// MUST be an even number!!
const INFINITE_SCROLL_TAG_COUNT_PER_PAGE = 50;

const apiSlicePath = '/elitea_core';
const TAG_TYPE_TAG = 'Tag';

export const tagApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_TAG],
  })
  .injectEndpoints({
    endpoints: build => ({
      tagList: build.query({
        query: ({ projectId, ...params }) => {
          const {
            query,
            collection_phrase,
            skipTotal,
            splitRequest = false,
            page,
            limit = INFINITE_SCROLL_TAG_COUNT_PER_PAGE,
            ...restParams
          } = params;
          const isLoadMore = page > 0;
          const removeCollectionPhrase = splitRequest && !skipTotal;
          const removeQuery = splitRequest && skipTotal;
          return {
            url: apiSlicePath + '/tags/prompt_lib/' + projectId,
            params: {
              offset: isLoadMore ? page * limit : 0,
              limit,
              collection_phrase: removeCollectionPhrase ? undefined : collection_phrase,
              query: removeQuery ? undefined : query,
              ...restParams,
            },
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.rows?.map(i => ({ type: TAG_TYPE_TAG, id: i.id }));
        },
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
            skipTotal: args.skipTotal,
          };
        },
        serializeQueryArgs: ({ endpointName }) => {
          return endpointName;
        },
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows.push(...newItems.rows);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      chatDatasourceTagList: build.query({
        query: ({ projectId, query, page, pageSize = PAGE_SIZE, params }) => {
          const isLoadMore = page > 0;
          return {
            url: apiSlicePath + '/tags/prompt_lib/' + projectId,
            params: {
              offset: isLoadMore ? page * pageSize : 0,
              limit: pageSize,
              entity_coverage: 'datasource',
              search: query,
              ...params,
            },
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.rows?.map(i => ({ type: TAG_TYPE_TAG, id: i.id }));
        },
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        serializeQueryArgs: ({ endpointName }) => {
          return endpointName;
        },
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows.push(...newItems.rows);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      chatPublicDatasourceTagList: build.query({
        query: ({ query, page, pageSize = PAGE_SIZE, params }) => {
          const isLoadMore = page > 0;
          return {
            url: apiSlicePath + '/tags/prompt_lib/' + PUBLIC_PROJECT_ID,
            params: {
              offset: isLoadMore ? page * pageSize : 0,
              limit: pageSize,
              entity_coverage: 'datasource',
              statuses: CollectionStatus.Published,
              search: query,
              ...params,
            },
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.rows?.map(i => ({ type: TAG_TYPE_TAG, id: i.id }));
        },
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        serializeQueryArgs: ({ endpointName }) => {
          return endpointName;
        },
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows.push(...newItems.rows);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      chatApplicationTagList: build.query({
        query: ({ projectId, query, page, pageSize = PAGE_SIZE, params }) => {
          const isLoadMore = page > 0;
          return {
            url: apiSlicePath + '/tags/prompt_lib/' + projectId,
            params: {
              offset: isLoadMore ? page * pageSize : 0,
              limit: pageSize,
              entity_coverage: 'application',
              search: query,
              ...params,
            },
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.rows?.map(i => ({ type: TAG_TYPE_TAG, id: i.id }));
        },
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        serializeQueryArgs: ({ endpointName }) => {
          return endpointName;
        },
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows.push(...newItems.rows);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
      chatPublicApplicationTagList: build.query({
        query: ({ query, page, pageSize = PAGE_SIZE, params }) => {
          const isLoadMore = page > 0;
          return {
            url: apiSlicePath + '/tags/prompt_lib/' + PUBLIC_PROJECT_ID,
            params: {
              offset: isLoadMore ? page * pageSize : 0,
              limit: pageSize,
              entity_coverage: 'application',
              statuses: CollectionStatus.Published,
              search: query,
              ...params,
            },
          };
        },
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.rows?.map(i => ({ type: TAG_TYPE_TAG, id: i.id }));
        },
        transformResponse: (response, meta, args) => {
          return {
            ...response,
            isLoadMore: args.page > 0,
          };
        },
        serializeQueryArgs: ({ endpointName }) => {
          return endpointName;
        },
        merge: (currentCache, newItems) => {
          if (newItems.isLoadMore) {
            currentCache.rows.push(...newItems.rows);
          } else {
            currentCache.rows = newItems.rows;
            currentCache.total = newItems.total;
          }
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
      }),
    }),
  });

export const {
  useTagListQuery,
  useLazyTagListQuery,
  useChatDatasourceTagListQuery,
  useChatPublicDatasourceTagListQuery,
  useChatApplicationTagListQuery,
  useChatPublicApplicationTagListQuery,
} = tagApi;
