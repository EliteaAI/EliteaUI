import { PAGE_SIZE } from '@/common/constants.js';

import { alitaApi } from './alitaApi.js';

const TAG_NOTIFICATIONS = 'TAG_NOTIFICATIONS';

export const notificationsApi = alitaApi
  .enhanceEndpoints({
    addTagTypes: ['notifications'],
  })
  .injectEndpoints({
    endpoints: build => ({
      notificationList: build.query({
        query: ({ projectId, page, pageSize = PAGE_SIZE, params }) => ({
          url: `/notifications/notifications/prompt_lib/${projectId}`,
          params: {
            ...params,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
      }),
      notificationRead: build.mutation({
        query: ({ projectId, id }) => ({
          method: 'PUT',
          url: `/notifications/notification/prompt_lib/${projectId}/${id}`,
          headers: {
            'Content-Type': 'application/json',
          },
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
    }),
  });

export const { useNotificationListQuery, useNotificationReadMutation } = notificationsApi;
