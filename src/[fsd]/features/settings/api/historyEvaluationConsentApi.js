import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';

const TAG_TYPE_HISTORY_EVALUATION_CONSENT = 'HISTORY_EVALUATION_CONSENT';

// Whether the scheduled evaluation may score this project's agents from their stored chats.
export const historyEvaluationConsentApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_HISTORY_EVALUATION_CONSENT],
  })
  .injectEndpoints({
    endpoints: build => ({
      evalHistoryConsent: build.query({
        query: ({ projectId }) => ({
          url: `${apiSlicePath}/eval_history_consent/prompt_lib/${projectId}`,
        }),
        providesTags: (_, _error, { projectId }) => [
          { type: TAG_TYPE_HISTORY_EVALUATION_CONSENT, id: projectId },
        ],
      }),
      setEvalHistoryConsent: build.mutation({
        query: ({ projectId, consent }) => ({
          url: `${apiSlicePath}/eval_history_consent/prompt_lib/${projectId}`,
          method: 'PUT',
          body: { history_evaluation_consent: Boolean(consent) },
        }),
        // Optimistic: the checkbox must not show the old value, enabled, between the save and a refetch.
        async onQueryStarted({ projectId, consent }, { dispatch, queryFulfilled }) {
          const patch = dispatch(
            historyEvaluationConsentApi.util.updateQueryData('evalHistoryConsent', { projectId }, draft => {
              draft.history_evaluation_consent = Boolean(consent);
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

export const { useEvalHistoryConsentQuery, useSetEvalHistoryConsentMutation } = historyEvaluationConsentApi;
