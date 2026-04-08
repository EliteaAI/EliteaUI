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
        query: ({ projectId, page, pageSize = PAGE_SIZE, params, sortBy, sortOrder, search }) => ({
          url: `/notifications/notifications/prompt_lib/${projectId}`,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
            sort_by: sortBy,
            sort_order: sortOrder,
            ...(search ? { search } : {}),
          },
        }),
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
