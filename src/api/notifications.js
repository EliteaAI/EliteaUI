import { PAGE_SIZE } from '@/common/constants.js';

import { eliteaApi } from './eliteaApi.js';

export const TAG_NOTIFICATIONS = 'TAG_NOTIFICATIONS';

export const notificationsApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: ['notifications'],
  })
  .injectEndpoints({
    endpoints: build => ({
      notificationList: build.query({
        query: ({
          projectId,
          page,
          pageSize = PAGE_SIZE,
          params,
          sortBy,
          sortOrder,
          tokens,
          metaSearchKeys,
        }) => {
          const serializedSearchTokens = tokens?.length ? JSON.stringify(tokens) : null;

          return {
            url: `/notifications/notifications/prompt_lib/${projectId}`,
            params: {
              ...params,
              limit: pageSize,
              offset: page * pageSize,
              sort_by: sortBy,
              sort_order: sortOrder,
              // Tokenized query: each token is an object { token, eventTypes,
              // eventTypeStatuses } carrying the token's static-text matches.
              // BE ANDs tokens, ORs axes within a token. Omitted when empty so
              // unfiltered calls keep their current shape.
              ...(serializedSearchTokens ? { search_tokens: serializedSearchTokens } : {}),
              // The BE has a default whitelist of meta keys it scans for
              // free-text search (see `_DEFAULT_META_SEARCH_KEYS` in the
              // notifications plugin). Normally we rely on that default to
              // keep the URL short. Only send `meta_search_keys` when the
              // caller explicitly wants to override it (e.g. a new FE-only
              // template introducing a meta key the BE default doesn't know
              // about yet).
              ...(metaSearchKeys?.length ? { meta_search_keys: metaSearchKeys } : {}),
            },
          };
        },
        providesTags: [TAG_NOTIFICATIONS],
      }),
      notificationRead: build.mutation({
        query: ({ projectId, id }) => ({
          method: 'PUT',
          url: `/notifications/notification/prompt_lib/${projectId}/${id}`,
        }),
        invalidatesTags: [TAG_NOTIFICATIONS],
      }),
      notificationDelete: build.mutation({
        query: ({ projectId, id }) => {
          return {
            url: `/notifications/notification/prompt_lib/${projectId}/${id}`,
            method: 'DELETE',
          };
        },
        invalidatesTags: [TAG_NOTIFICATIONS],
      }),
      notificationBulkDelete: build.mutation({
        query: ({ projectId, ids }) => ({
          url: `/notifications/notifications/prompt_lib/${projectId}`,
          method: 'DELETE',
          body: { ids },
        }),
        invalidatesTags: [TAG_NOTIFICATIONS],
      }),
      notificationBulkMarkSeen: build.mutation({
        query: ({ projectId, ids, isSeen }) => ({
          url: `/notifications/notifications/prompt_lib/${projectId}`,
          method: 'PUT',
          body: { ids, is_seen: isSeen },
        }),
        invalidatesTags: [TAG_NOTIFICATIONS],
      }),
    }),
  });

export const {
  useNotificationListQuery,
  useNotificationReadMutation,
  useNotificationDeleteMutation,
  useNotificationBulkDeleteMutation,
  useNotificationBulkMarkSeenMutation,
} = notificationsApi;
