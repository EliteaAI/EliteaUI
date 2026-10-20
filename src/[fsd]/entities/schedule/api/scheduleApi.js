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
        query: ({ projectId, page = 0, pageSize = PAGE_SIZE, ...filters }) => ({
          url: `/elitea_core/schedules/prompt_lib/${projectId}`,
          params: {
            ...filters,
            limit: pageSize,
            offset: page * pageSize,
          },
        }),
        providesTags: [SCHEDULES_TAG],
      }),
    }),
  });

export const { useGetScheduleListQuery } = scheduleApi;
