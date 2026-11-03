import { SCHEDULES_TAG } from '@/[fsd]/entities/schedule/api/scheduleApi';
import { eliteaApi } from '@/api';
import { TAG_TYPE_GOVERNANCE_READINESS } from '@/api/applications';
import { TAG_TYPE_DETAILS_TOOLKITS } from '@/api/toolkits';

const TAG_PROJECT_GOVERNANCE = 'PROJECT_GOVERNANCE';
// read again by every successful version or toolkit change (``withReadiness`` in the applications and toolkits APIs)
export const TAG_GOVERNANCE_READINESS = TAG_TYPE_GOVERNANCE_READINESS;
const LIST_LIMIT = 50;

const project = projectId => encodeURIComponent(projectId);
const tags = [TAG_PROJECT_GOVERNANCE];
// A list's page: its newest rows, or (the inbox) the rows waiting in one state, oldest first, filtered by the server
const listParams = ({ state, inbox }) => ({
  limit: LIST_LIMIT,
  ...(state && { state }),
  ...(inbox && { sort_by: 'created_at', sort_order: 'asc' }),
});

// The project operator view (C-1009, #7269): the administration lists and actions of agent identities, credential
// references, grants and mandates, in project (default) mode for the project's own admins. The server checks every
// permission again in the project and answers only while governance is enforced.
export const projectGovernanceApi = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_PROJECT_GOVERNANCE, TAG_GOVERNANCE_READINESS] })
  .injectEndpoints({
    endpoints: build => ({
      getProjectBindings: build.query({
        query: ({ projectId, state, inbox }) => ({
          url: `/elitea_core/agent_identities/default/${project(projectId)}`,
          params: listParams({ state, inbox }),
        }),
        providesTags: tags,
      }),
      projectBindingAction: build.mutation({
        query: ({ projectId, bindingId, ...body }) => ({
          url: `/elitea_core/agent_identity_action/default/${project(projectId)}/${encodeURIComponent(bindingId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_PROJECT_GOVERNANCE, TAG_GOVERNANCE_READINESS],
      }),
      getProjectReferences: build.query({
        query: ({ projectId, state, inbox }) => ({
          url: `/secrets/credential_references/default/${project(projectId)}`,
          params: listParams({ state, inbox }),
        }),
        providesTags: tags,
      }),
      projectReferenceAction: build.mutation({
        query: ({ projectId, referenceId, ...body }) => ({
          url: `/secrets/credential_reference_action/default/${project(projectId)}/${encodeURIComponent(referenceId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_PROJECT_GOVERNANCE, TAG_GOVERNANCE_READINESS],
      }),
      getProjectGrants: build.query({
        query: ({ projectId, state, inbox }) => ({
          url: `/secrets/credential_grants/default/${project(projectId)}`,
          params: listParams({ state, inbox }),
        }),
        providesTags: tags,
      }),
      // (#7269) what an agent or pipeline version, a toolkit or a schedule still needs to run governed for the caller;
      // read again after a save (the toolkit's and the schedule's own tags) and after a request
      getGovernanceReadiness: build.query({
        query: ({ projectId, entityKind, entityId }) => ({
          url: `/elitea_core/governance_readiness/prompt_lib/${project(projectId)}/${entityKind}/${entityId}`,
        }),
        providesTags: (_, _error, { entityKind, entityId }) => [
          TAG_GOVERNANCE_READINESS,
          ...(entityKind === 'toolkit' ? [{ type: TAG_TYPE_DETAILS_TOOLKITS, id: entityId }] : []),
          ...(entityKind === 'schedule' ? [{ type: SCHEDULES_TAG, id: entityId }] : []),
        ],
      }),
      // A member's request: what readiness says is requestable, filed as one batch (keys: those only)
      requestGovernedSetup: build.mutation({
        query: ({ projectId, entityKind, entityId, keys }) => ({
          url: `/elitea_core/governance_requests/prompt_lib/${project(projectId)}`,
          method: 'POST',
          body: { entity_kind: entityKind, entity_id: entityId, ...(keys && { keys }) },
        }),
        invalidatesTags: [TAG_GOVERNANCE_READINESS, TAG_PROJECT_GOVERNANCE],
      }),
      // A member's own personal references (``mine=true``): the generation and type of the one whose value they write
      getMyCredentialReferences: build.query({
        query: ({ projectId }) => ({
          url: `/secrets/credential_references/default/${project(projectId)}`,
          params: { mine: 'true', limit: 100 },
        }),
        providesTags: [TAG_GOVERNANCE_READINESS],
      }),
      // The owner writes the value of their personal reference (write-only; it goes back to pending for a check and an
      // approval). The value is sent once and never read back.
      putMyCredentialValue: build.mutation({
        query: ({ projectId, referenceId, fields, expectedGeneration }) => ({
          url: `/secrets/credential_material/default/${project(projectId)}/${encodeURIComponent(referenceId)}`,
          method: 'PUT',
          body: { fields, expected_generation: expectedGeneration },
        }),
        invalidatesTags: (_result, error) =>
          error ? [] : [TAG_GOVERNANCE_READINESS, TAG_PROJECT_GOVERNANCE],
      }),
      // (#7341) which version of each agent external MCP clients reach in the project
      getMcpExposedVersions: build.query({
        query: ({ projectId }) => ({
          url: `/elitea_core/mcp_exposed_versions/prompt_lib/${project(projectId)}`,
        }),
      }),
      projectGrantAction: build.mutation({
        query: ({ projectId, grantId, ...body }) => ({
          url: `/secrets/credential_grant_action/default/${project(projectId)}/${encodeURIComponent(grantId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_PROJECT_GOVERNANCE, TAG_GOVERNANCE_READINESS],
      }),
      getProjectMandates: build.query({
        query: ({ projectId, state, inbox }) => ({
          url: `/elitea_core/autonomous_mandates/default/${project(projectId)}`,
          params: listParams({ state, inbox }),
        }),
        providesTags: tags,
      }),
      projectMandateAction: build.mutation({
        query: ({ projectId, mandateId, ...body }) => ({
          url: `/elitea_core/autonomous_mandate_action/default/${project(projectId)}/${encodeURIComponent(mandateId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: [TAG_PROJECT_GOVERNANCE, TAG_GOVERNANCE_READINESS],
      }),
    }),
  });

export const {
  useGetProjectBindingsQuery,
  useProjectBindingActionMutation,
  useGetProjectReferencesQuery,
  useProjectReferenceActionMutation,
  useGetProjectGrantsQuery,
  useProjectGrantActionMutation,
  useGetProjectMandatesQuery,
  useProjectMandateActionMutation,
  useGetGovernanceReadinessQuery,
  useRequestGovernedSetupMutation,
  useGetMcpExposedVersionsQuery,
  useLazyGetMyCredentialReferencesQuery,
  usePutMyCredentialValueMutation,
} = projectGovernanceApi;
