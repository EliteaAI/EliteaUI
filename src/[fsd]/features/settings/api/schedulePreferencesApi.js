import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';

const TAG_TYPE_SCHEDULE_PREFERENCES = 'SCHEDULE_PREFERENCES';

export const schedulePreferencesApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_SCHEDULE_PREFERENCES],
  })
  .injectEndpoints({
    endpoints: build => ({
      getSchedulePreferences: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/schedules/prompt_lib/${projectId}/preferences`,
        }),
        providesTags: (_, _error, { projectId }) => [{ type: TAG_TYPE_SCHEDULE_PREFERENCES, id: projectId }],
      }),
      updateSchedulePreferences: build.mutation({
        query: ({ projectId, getNotified }) => ({
          url: `${apiSlicePath}/schedules/prompt_lib/${projectId}/preferences`,
          method: 'PUT',
          body: { get_notified: getNotified },
        }),
        // Optimistic: the checkbox must not flicker back while the save runs.
        async onQueryStarted({ projectId, getNotified }, { dispatch, queryFulfilled }) {
          const patch = dispatch(
            schedulePreferencesApi.util.updateQueryData('getSchedulePreferences', { projectId }, draft => {
              draft.get_notified = getNotified;
            }),
          );
          try {
            await queryFulfilled;
          } catch {
            patch.undo();
          }
        },
      }),
    }),
  });

export const { useGetSchedulePreferencesQuery, useUpdateSchedulePreferencesMutation } =
  schedulePreferencesApi;
