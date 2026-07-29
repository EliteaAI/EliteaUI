import { eliteaApi } from '@/api/eliteaApi.js';

export const TAG_CURRENT_SURVEYS = 'CurrentSurveys';
const API_PATH = '/social';
const SURVEY_MODE = 'default';

const npsSurveyApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_CURRENT_SURVEYS],
  })
  .injectEndpoints({
    endpoints: build => ({
      getCurrentSurveys: build.query({
        query: () => ({
          url: `${API_PATH}/current_survey/${SURVEY_MODE}`,
        }),
        transformResponse: response => response.result?.rows ?? [],
        providesTags: [TAG_CURRENT_SURVEYS],
      }),
      submitSurveyResponse: build.mutation({
        query: ({ surveyId, answers }) => ({
          url: `${API_PATH}/survey_response/${SURVEY_MODE}/${surveyId}`,
          method: 'POST',
          body: { answers },
        }),
      }),
    }),
  });

export const { useGetCurrentSurveysQuery, useSubmitSurveyResponseMutation } = npsSurveyApi;
