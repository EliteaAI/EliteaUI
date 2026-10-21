import { getFilenameFromContentDisposition } from '@/[fsd]/shared/lib/helpers';
import { eliteaApi } from '@/api/eliteaApi.js';
import { PAGE_SIZE } from '@/common/constants.js';

export const SCHEDULES_TAG = 'SCHEDULES_TAG';
export const SCHEDULE_RUNS_TAG = 'SCHEDULE_RUNS_TAG';
const SCHEDULE_SETTINGS_TAG = 'SCHEDULE_SETTINGS_TAG';

// false is a real value (enabled=false); only unset, blank and empty list are left out
const isSet = value => value !== undefined && value !== null && value !== '' && value?.length !== 0;

const schedulesPath = projectId => `/elitea_core/schedules/prompt_lib/${projectId}`;
const schedulePath = (projectId, scheduleId) => `${schedulesPath(projectId)}/${scheduleId}`;

// POST .../pause or .../resume with no body. Enabled changes in every cached list entry at once
// and all patches are undone on error (US-28 R3).
const setEnabledMutation = (build, action, enabled) =>
  build.mutation({
    query: ({ projectId, scheduleId }) => ({
      url: `${schedulePath(projectId, scheduleId)}/${action}`,
      method: 'POST',
    }),
    async onQueryStarted({ scheduleId }, { dispatch, getState, queryFulfilled }) {
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
  });

export const scheduleApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [SCHEDULES_TAG, SCHEDULE_RUNS_TAG, SCHEDULE_SETTINGS_TAG],
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
          entityId,
          versionId,
          status,
          enabled,
          search,
          ownerIds,
        }) => {
          const filterParams = {
            entity_type: entityType,
            entity_id: entityId,
            version_id: versionId,
            status,
            enabled,
            search,
            owner_ids: ownerIds?.join(','),
          };
          return {
            url: schedulesPath(projectId),
            params: {
              ...Object.fromEntries(Object.entries(filterParams).filter(([, value]) => isSet(value))),
              sort_by: sortBy,
              sort_order: sortOrder,
              limit: pageSize,
              offset: page * pageSize,
            },
          };
        },
        transformResponse: response => ({
          ...response,
          runWithoutAskingAllowed: response?.run_without_asking_allowed === true,
        }),
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

      // One run with its log `events` and `summary` (owner CR 2026-10-21 test panel log)
      getScheduleRun: build.query({
        query: ({ projectId, scheduleId, runId }) => ({
          url: `${schedulePath(projectId, scheduleId)}/runs/${runId}`,
        }),
        providesTags: [SCHEDULE_RUNS_TAG],
      }),

      createSchedule: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: schedulesPath(projectId),
          method: 'POST',
          body,
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG]),
      }),

      // Dry run of the save risk scan; it writes nothing, so it invalidates nothing (owner CR 2026-10-21)
      checkScheduleRisk: build.mutation({
        query: ({ projectId, ...body }) => ({
          url: `${schedulesPath(projectId)}/check`,
          method: 'POST',
          body,
        }),
      }),

      runSchedule: build.mutation({
        query: ({ projectId, scheduleId, trigger = 'manual' }) => ({
          url: `${schedulePath(projectId, scheduleId)}/run`,
          method: 'POST',
          body: { trigger },
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG, SCHEDULE_RUNS_TAG]),
      }),

      // enabled is never sent: pause and resume are their own actions (owner CR 2026-10-21)
      updateSchedule: build.mutation({
        // eslint-disable-next-line no-unused-vars
        query: ({ projectId, scheduleId, enabled, ...body }) => ({
          url: schedulePath(projectId, scheduleId),
          method: 'PUT',
          body,
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG, SCHEDULE_RUNS_TAG]),
      }),

      pauseSchedule: setEnabledMutation(build, 'pause', false),
      resumeSchedule: setEnabledMutation(build, 'resume', true),

      changeScheduleOwner: build.mutation({
        query: ({ projectId, scheduleId, ownerId }) => ({
          url: `${schedulePath(projectId, scheduleId)}/owner`,
          method: 'POST',
          body: { owner_id: ownerId },
        }),
        // A 403 or 404 means the row changed on the server, so the list refetches too (R3.4)
        invalidatesTags: (_, error) => (!error || [403, 404].includes(error.status) ? [SCHEDULES_TAG] : []),
      }),

      deleteSchedule: build.mutation({
        query: ({ projectId, scheduleId }) => ({
          url: schedulePath(projectId, scheduleId),
          method: 'DELETE',
        }),
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG]),
      }),

      // Lazy use only. A function responseHandler also runs for error responses, so branch on ok
      // to keep the server's JSON error in error.data (buildErrorMessage reads it).
      // ids exports only these schedules (one schedule from a row menu); no ids exports the project
      exportSchedules: build.query({
        query: ({ projectId, ids }) => ({
          url: `${schedulesPath(projectId)}/export`,
          params: ids?.length ? { ids: ids.join(',') } : undefined,
          responseHandler: async response =>
            response.ok
              ? {
                  blob: await response.blob(),
                  filename: getFilenameFromContentDisposition(
                    response.headers.get('content-disposition') || '',
                    `schedules_${projectId}.yaml`,
                  ),
                }
              : response.json(),
        }),
        keepUnusedDataFor: 0,
      }),

      importSchedules: build.mutation({
        query: ({ projectId, file }) => {
          const body = new FormData();
          body.append('file', file);
          return {
            url: `${schedulesPath(projectId)}/import`,
            method: 'POST',
            body,
            formData: true,
          };
        },
        invalidatesTags: (result, error) =>
          !error && (result?.created?.length || result?.updated?.length) ? [SCHEDULES_TAG] : [],
      }),

      // Project setting "Allow Run without asking" (owner CR 2026-10-21); read by any member
      getScheduleSettings: build.query({
        query: ({ projectId }) => ({ url: `${schedulesPath(projectId)}/settings` }),
        providesTags: (_, _error, { projectId }) => [{ type: SCHEDULE_SETTINGS_TAG, id: projectId }],
      }),

      // Project admin only. Optimistic so the checkbox does not flicker back; the list refetch
      // gives the schedule form the new run_without_asking_allowed flag.
      updateScheduleSettings: build.mutation({
        query: ({ projectId, allowRunWithoutAsking }) => ({
          url: `${schedulesPath(projectId)}/settings`,
          method: 'PUT',
          body: { allow_run_without_asking: allowRunWithoutAsking },
        }),
        async onQueryStarted({ projectId, allowRunWithoutAsking }, { dispatch, queryFulfilled }) {
          const patch = dispatch(
            scheduleApi.util.updateQueryData('getScheduleSettings', { projectId }, draft => {
              draft.allow_run_without_asking = allowRunWithoutAsking;
            }),
          );
          try {
            await queryFulfilled;
          } catch {
            patch.undo();
          }
        },
        invalidatesTags: (_, error) => (error ? [] : [SCHEDULES_TAG]),
      }),
    }),
  });

export const {
  useGetScheduleQuery,
  useGetScheduleRunsQuery,
  useGetScheduleRunQuery,
  useGetScheduleListQuery,
  useCreateScheduleMutation,
  useCheckScheduleRiskMutation,
  useRunScheduleMutation,
  useUpdateScheduleMutation,
  usePauseScheduleMutation,
  useResumeScheduleMutation,
  useChangeScheduleOwnerMutation,
  useDeleteScheduleMutation,
  useLazyExportSchedulesQuery,
  useImportSchedulesMutation,
  useGetScheduleSettingsQuery,
  useUpdateScheduleSettingsMutation,
} = scheduleApi;
