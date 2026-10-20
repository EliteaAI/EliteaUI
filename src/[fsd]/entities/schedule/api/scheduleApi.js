import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE } from '@/common/constants.js';

export const SCHEDULES_TAG = 'SCHEDULES_TAG';
export const SCHEDULE_RUNS_TAG = 'SCHEDULE_RUNS_TAG';

// false is a real value (enabled=false); only unset, blank and empty list are left out
const isSet = value => value !== undefined && value !== null && value !== '' && value?.length !== 0;

const schedulePath = (projectId, scheduleId) => `/elitea_core/schedule/prompt_lib/${projectId}/${scheduleId}`;

export const scheduleApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [SCHEDULES_TAG, SCHEDULE_RUNS_TAG],
  })
  .injectEndpoints({
    endpoints: build => ({
      getScheduleList: build.query({
        query: ({
          projectId,
          page = 0,
          pageSize = PAGE_SIZE,
          sortBy,
          sortOrder,
          entityType,
          status,
          enabled,
          search,
          ownerIds,
        }) => {
          const filterParams = {
            entity_type: entityType,
            status,
            enabled,
            search,
            owner_ids: ownerIds?.join(','),
          };
          return {
            url: `/elitea_core/schedules/prompt_lib/${projectId}`,
            params: {
              ...Object.fromEntries(Object.entries(filterParams).filter(([, value]) => isSet(value))),
              sort_by: sortBy,
              sort_order: sortOrder,
              limit: pageSize,
              offset: page * pageSize,
            },
          };
        },
        providesTags: [SCHEDULES_TAG],
      }),

      getSchedule: build.query({
        query: ({ projectId, scheduleId }) => ({ url: schedulePath(projectId, scheduleId) }),
        providesTags: [SCHEDULES_TAG],
      }),

      getScheduleRuns: build.query({
        query: ({ projectId, scheduleId, page = 0, pageSize = PAGE_SIZE }) => ({
          url: `${schedulePath(projectId, scheduleId)}/runs`,
          params: { limit: pageSize, offset: page * pageSize },
        }),
        providesTags: [SCHEDULE_RUNS_TAG],
      }),

      createSchedule: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: `/elitea_core/schedule/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG]),
      }),

      runSchedule: build.mutation({
        query: ({ projectId, scheduleId, trigger = 'manual' }) => ({
          url: `${schedulePath(projectId, scheduleId)}/run`,
          method: 'POST',
          body: { trigger },
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG, SCHEDULE_RUNS_TAG]),
      }),

      // A body with enabled patches it in every cached list entry at once; undoes all patches on error.
      updateSchedule: build.mutation({
        query: ({ projectId, scheduleId, ...body }) => ({
          url: schedulePath(projectId, scheduleId),
          method: 'PUT',
          body,
        }),
        async onQueryStarted({ scheduleId, enabled }, { dispatch, getState, queryFulfilled }) {
          if (enabled === undefined) return;
          const patches = scheduleApi.util.selectCachedArgsForQuery(getState(), 'getScheduleList').map(args =>
            dispatch(
              scheduleApi.util.updateQueryData('getScheduleList', args, draft => {
                const row = draft?.rows?.find(item => item.id === scheduleId);
                if (row) row.enabled = enabled;
              }),
            ),
          );
          try {
            await queryFulfilled;
          } catch {
            patches.forEach(patch => patch.undo());
          }
        },
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG, SCHEDULE_RUNS_TAG]),
      }),

      deleteSchedule: build.mutation({
        query: ({ projectId, scheduleId }) => ({
          url: schedulePath(projectId, scheduleId),
          method: 'DELETE',
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG]),
      }),
    }),
  });

export const {
  useGetScheduleQuery,
  useGetScheduleRunsQuery,
  useGetScheduleListQuery,
  useCreateScheduleMutation,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
} = scheduleApi;
