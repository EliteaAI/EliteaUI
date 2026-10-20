import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE } from '@/common/constants.js';

export const SCHEDULES_TAG = 'SCHEDULES_TAG';

export const scheduleApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [SCHEDULES_TAG],
  })
  .injectEndpoints({
    endpoints: build => ({
      getScheduleList: build.query({
        query: ({ projectId, page = 0, pageSize = PAGE_SIZE, sortBy, sortOrder, ...filters }) => ({
          url: `/elitea_core/schedules/prompt_lib/${projectId}`,
          params: {
            ...filters,
            sort_by: sortBy,
            sort_order: sortOrder,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [SCHEDULES_TAG],
      }),

      createSchedule: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: `/elitea_core/schedule/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG]),
      }),
    }),
  });

export const { useGetScheduleListQuery, useCreateScheduleMutation } = scheduleApi;
