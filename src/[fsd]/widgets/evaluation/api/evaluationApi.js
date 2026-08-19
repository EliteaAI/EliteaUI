import { eliteaApi } from '@/api';

const TAG_EVAL_DIMENSION = 'EVAL_DIMENSION';
const TAG_EVAL_CODE_VALIDATION = 'EVAL_CODE_VALIDATION';
const TAG_EVAL_SUITE = 'EVAL_SUITE';
const TAG_EVAL_BINDING = 'EVAL_BINDING';
const TAG_EVAL_DATASET = 'EVAL_DATASET';
const TAG_EVAL_DATASET_CASE = 'EVAL_DATASET_CASE';
const TAG_EVAL_RUN = 'EVAL_RUN';
const TAG_EVAL_RESULT = 'EVAL_RESULT';
const TAG_EVAL_HUMAN_SCORE = 'EVAL_HUMAN_SCORE';

export const evaluationApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [
      TAG_EVAL_DIMENSION,
      TAG_EVAL_CODE_VALIDATION,
      TAG_EVAL_SUITE,
      TAG_EVAL_BINDING,
      TAG_EVAL_DATASET,
      TAG_EVAL_DATASET_CASE,
      TAG_EVAL_RUN,
      TAG_EVAL_RESULT,
      TAG_EVAL_HUMAN_SCORE,
    ],
  })
  .injectEndpoints({
    endpoints: build => ({
      evalDimensions: build.query({
        query: ({ projectId, includePlatform = true }) => ({
          url: `/elitea_core/eval_dimensions/prompt_lib/${projectId}?include_platform=${includePlatform}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_DIMENSION],
      }),
      createEvalDimension: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/elitea_core/eval_dimensions/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DIMENSION],
      }),
      updateEvalDimension: build.mutation({
        query: ({ projectId, dimensionId, body }) => ({
          url: `/elitea_core/eval_dimension/prompt_lib/${projectId}/${dimensionId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DIMENSION],
      }),
      deleteEvalDimension: build.mutation({
        query: ({ projectId, dimensionId }) => ({
          url: `/elitea_core/eval_dimension/prompt_lib/${projectId}/${dimensionId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_EVAL_DIMENSION],
      }),
      // The platform catalog is registry-backed: a project only gets its own dimension row
      // once it attaches an entry, which is what materializePlatformDimension does.
      platformDimensionCatalog: build.query({
        query: ({ projectId }) => ({
          url: `/elitea_core/eval_platform_catalog/prompt_lib/${projectId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_DIMENSION],
      }),
      materializePlatformDimension: build.mutation({
        query: ({ projectId, uuid }) => ({
          url: `/elitea_core/eval_platform_catalog/prompt_lib/${projectId}`,
          method: 'POST',
          body: { uuid },
        }),
        invalidatesTags: [TAG_EVAL_DIMENSION],
      }),
      evalCodeValidations: build.query({
        query: ({ projectId }) => ({
          url: `/elitea_core/eval_code_validations/prompt_lib/${projectId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_CODE_VALIDATION],
      }),
      createEvalCodeValidation: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/elitea_core/eval_code_validations/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_CODE_VALIDATION],
      }),
      updateEvalCodeValidation: build.mutation({
        query: ({ projectId, codeValidationId, body }) => ({
          url: `/elitea_core/eval_code_validation/prompt_lib/${projectId}/${codeValidationId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_CODE_VALIDATION],
      }),
      deleteEvalCodeValidation: build.mutation({
        query: ({ projectId, codeValidationId }) => ({
          url: `/elitea_core/eval_code_validation/prompt_lib/${projectId}/${codeValidationId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_EVAL_CODE_VALIDATION],
      }),

      // ---- Suites ----
      evalSuites: build.query({
        query: ({ projectId, applicationId }) => ({
          url: `/elitea_core/eval_suites/prompt_lib/${projectId}${
            applicationId ? `?application_id=${applicationId}` : ''
          }`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_SUITE],
      }),
      bootstrapEvalSuite: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/elitea_core/eval_suites/prompt_lib/${projectId}?bootstrap=true`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_SUITE],
      }),
      createEvalSuite: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/elitea_core/eval_suites/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_SUITE],
      }),
      evalSuite: build.query({
        query: ({ projectId, suiteId }) => ({
          url: `/elitea_core/eval_suite/prompt_lib/${projectId}/${suiteId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_SUITE, TAG_EVAL_BINDING],
      }),
      updateEvalSuite: build.mutation({
        query: ({ projectId, suiteId, body }) => ({
          url: `/elitea_core/eval_suite/prompt_lib/${projectId}/${suiteId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_SUITE],
      }),
      deleteEvalSuite: build.mutation({
        query: ({ projectId, suiteId }) => ({
          url: `/elitea_core/eval_suite/prompt_lib/${projectId}/${suiteId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_EVAL_SUITE],
      }),

      // ---- Bindings ----
      evalBindings: build.query({
        query: ({ projectId, suiteId }) => ({
          url: `/elitea_core/eval_bindings/prompt_lib/${projectId}/${suiteId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_BINDING],
      }),
      addEvalBinding: build.mutation({
        query: ({ projectId, suiteId, body }) => ({
          url: `/elitea_core/eval_bindings/prompt_lib/${projectId}/${suiteId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_BINDING, TAG_EVAL_SUITE],
      }),
      reorderEvalBindings: build.mutation({
        query: ({ projectId, suiteId, body }) => ({
          url: `/elitea_core/eval_bindings/prompt_lib/${projectId}/${suiteId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_BINDING, TAG_EVAL_SUITE],
      }),
      updateEvalBinding: build.mutation({
        query: ({ projectId, suiteId, bindingId, body }) => ({
          url: `/elitea_core/eval_binding/prompt_lib/${projectId}/${suiteId}/${bindingId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_BINDING, TAG_EVAL_SUITE],
      }),
      deleteEvalBinding: build.mutation({
        query: ({ projectId, suiteId, bindingId }) => ({
          url: `/elitea_core/eval_binding/prompt_lib/${projectId}/${suiteId}/${bindingId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_EVAL_BINDING, TAG_EVAL_SUITE],
      }),

      // ---- Datasets ----
      evalDatasets: build.query({
        query: ({ projectId }) => ({
          url: `/elitea_core/eval_datasets/prompt_lib/${projectId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_DATASET],
      }),
      evalDataset: build.query({
        query: ({ projectId, datasetId }) => ({
          url: `/elitea_core/eval_dataset/prompt_lib/${projectId}/${datasetId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_DATASET, TAG_EVAL_DATASET_CASE],
      }),
      createEvalDataset: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/elitea_core/eval_datasets/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DATASET],
      }),
      updateEvalDataset: build.mutation({
        query: ({ projectId, datasetId, body }) => ({
          url: `/elitea_core/eval_dataset/prompt_lib/${projectId}/${datasetId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DATASET],
      }),
      deleteEvalDataset: build.mutation({
        query: ({ projectId, datasetId }) => ({
          url: `/elitea_core/eval_dataset/prompt_lib/${projectId}/${datasetId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_EVAL_DATASET],
      }),

      // ---- Dataset cases ----
      addEvalDatasetCase: build.mutation({
        query: ({ projectId, datasetId, body }) => ({
          url: `/elitea_core/eval_dataset_cases/prompt_lib/${projectId}/${datasetId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DATASET, TAG_EVAL_DATASET_CASE],
      }),
      updateEvalDatasetCase: build.mutation({
        query: ({ projectId, datasetId, caseId, body }) => ({
          url: `/elitea_core/eval_dataset_case/prompt_lib/${projectId}/${datasetId}/${caseId}`,
          method: 'PUT',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DATASET, TAG_EVAL_DATASET_CASE],
      }),
      deleteEvalDatasetCase: build.mutation({
        query: ({ projectId, datasetId, caseId }) => ({
          url: `/elitea_core/eval_dataset_case/prompt_lib/${projectId}/${datasetId}/${caseId}`,
          method: 'DELETE',
        }),
        invalidatesTags: [TAG_EVAL_DATASET, TAG_EVAL_DATASET_CASE],
      }),
      importEvalDataset: build.mutation({
        query: ({ projectId, datasetId, body }) => ({
          url: `/elitea_core/eval_dataset_import/prompt_lib/${projectId}/${datasetId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DATASET, TAG_EVAL_DATASET_CASE],
      }),
      promoteEvalDataset: build.mutation({
        query: ({ projectId, datasetId, body }) => ({
          url: `/elitea_core/eval_dataset_promote/prompt_lib/${projectId}/${datasetId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_DATASET, TAG_EVAL_DATASET_CASE],
      }),

      // ---- Conversations (promote picker source) ----
      evalConversations: build.query({
        // `source` selects which conversation store to browse: 'elitea' = chat
        // conversations, 'agent,pipeline' = run history. When `applicationId` is
        // given the list is scoped to that agent via the participant filter.
        query: ({
          projectId,
          search = '',
          source = 'elitea',
          applicationId = null,
          limit = 50,
          offset = 0,
        }) => {
          const params = new URLSearchParams();
          if (search) params.set('query', search);
          if (source) params.set('source', source);
          if (applicationId) {
            params.set('participant_id', String(applicationId));
            params.set('entity_name', 'application');
          }
          params.set('limit', String(limit));
          params.set('offset', String(offset));
          return {
            url: `/elitea_core/conversations/prompt_lib/${projectId}?${params.toString()}`,
            method: 'GET',
          };
        },
      }),

      // ---- Runs ----
      evalRuns: build.query({
        query: ({ projectId, applicationId, suiteId }) => {
          const params = new URLSearchParams();
          if (applicationId) params.set('application_id', applicationId);
          if (suiteId) params.set('suite_id', suiteId);
          const qs = params.toString();
          return {
            url: `/elitea_core/eval_runs/prompt_lib/${projectId}${qs ? `?${qs}` : ''}`,
            method: 'GET',
          };
        },
        providesTags: [TAG_EVAL_RUN],
      }),
      evalRun: build.query({
        query: ({ projectId, runId }) => ({
          url: `/elitea_core/eval_run/prompt_lib/${projectId}/${runId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_RUN],
      }),
      startEvalRun: build.mutation({
        query: ({ projectId, body }) => ({
          url: `/elitea_core/eval_runs/prompt_lib/${projectId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_RUN],
      }),
      // Ask a run to stop (§14.2). A queued run comes back already `cancelled`; a
      // running one keeps reporting `running` until its worker reaches the next case
      // boundary and writes the terminal row, so the progress poll is what surfaces
      // the final status rather than this response.
      cancelEvalRun: build.mutation({
        query: ({ projectId, runId }) => ({
          url: `/elitea_core/eval_run_cancel/prompt_lib/${projectId}/${runId}`,
          method: 'POST',
        }),
        invalidatesTags: [TAG_EVAL_RUN],
      }),

      // ---- Results scorecard (B5, #6202) ----
      // Returns { run, results[], human_scores[], headline_score } for a single
      // run so the scorecard (§15) can render aggregates and drill-downs.
      evalRunResults: build.query({
        query: ({ projectId, runId }) => ({
          url: `/elitea_core/eval_results/prompt_lib/${projectId}/${runId}`,
          method: 'GET',
        }),
        providesTags: [TAG_EVAL_RESULT, TAG_EVAL_HUMAN_SCORE],
      }),

      // ---- Human scores (B6, #6203) ----
      evalHumanScores: build.query({
        query: ({ projectId, runId, datasetCaseId, dimensionId, latest }) => {
          const params = new URLSearchParams();
          if (datasetCaseId != null) params.set('dataset_case_id', String(datasetCaseId));
          if (dimensionId != null) params.set('dimension_id', String(dimensionId));
          if (latest != null) params.set('latest', String(latest));
          const qs = params.toString();
          return {
            url: `/elitea_core/eval_human_scores/prompt_lib/${projectId}/${runId}${qs ? `?${qs}` : ''}`,
            method: 'GET',
          };
        },
        providesTags: [TAG_EVAL_HUMAN_SCORE],
      }),
      // Append-only human score. A write re-aggregates the run server-side, so we
      // invalidate the scorecard read (results + human scores) and the run
      // summary to pull the refreshed headline.
      writeEvalHumanScore: build.mutation({
        query: ({ projectId, runId, body }) => ({
          url: `/elitea_core/eval_human_scores/prompt_lib/${projectId}/${runId}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_EVAL_RESULT, TAG_EVAL_HUMAN_SCORE, TAG_EVAL_RUN],
      }),
    }),
  });

export const {
  useEvalDimensionsQuery,
  useCreateEvalDimensionMutation,
  useUpdateEvalDimensionMutation,
  useDeleteEvalDimensionMutation,
  usePlatformDimensionCatalogQuery,
  useMaterializePlatformDimensionMutation,
  useEvalCodeValidationsQuery,
  useCreateEvalCodeValidationMutation,
  useUpdateEvalCodeValidationMutation,
  useDeleteEvalCodeValidationMutation,
  useEvalSuitesQuery,
  useBootstrapEvalSuiteMutation,
  useCreateEvalSuiteMutation,
  useEvalSuiteQuery,
  useUpdateEvalSuiteMutation,
  useDeleteEvalSuiteMutation,
  useEvalBindingsQuery,
  useAddEvalBindingMutation,
  useReorderEvalBindingsMutation,
  useUpdateEvalBindingMutation,
  useDeleteEvalBindingMutation,
  useEvalDatasetsQuery,
  useEvalDatasetQuery,
  useCreateEvalDatasetMutation,
  useUpdateEvalDatasetMutation,
  useDeleteEvalDatasetMutation,
  useAddEvalDatasetCaseMutation,
  useUpdateEvalDatasetCaseMutation,
  useDeleteEvalDatasetCaseMutation,
  useImportEvalDatasetMutation,
  usePromoteEvalDatasetMutation,
  useEvalConversationsQuery,
  useEvalRunsQuery,
  useEvalRunQuery,
  useStartEvalRunMutation,
  useCancelEvalRunMutation,
  useEvalRunResultsQuery,
  useEvalHumanScoresQuery,
  useWriteEvalHumanScoreMutation,
} = evaluationApi;
