import { eliteaApi } from '@/api';

const TAG_PROJECT_GOVERNANCE = 'PROJECT_GOVERNANCE';
const LIST_LIMIT = 50;

const project = projectId => encodeURIComponent(projectId);
const tags = [TAG_PROJECT_GOVERNANCE];

// The project operator view (C-1009, #7269): the administration lists and actions of agent identities, credential
// references, grants and mandates, in project (default) mode for the project's own admins. The server checks every
// permission again in the project and answers only while governance is enforced.
export const projectGovernanceApi = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_PROJECT_GOVERNANCE] })
  .injectEndpoints({
    endpoints: build => ({
      getProjectBindings: build.query({
        query: ({ projectId, state }) => ({
          url: `/elitea_core/agent_identities/default/${project(projectId)}`,
          params: { limit: LIST_LIMIT, ...(state && { state }) },
        }),
        providesTags: tags,
      }),
      projectBindingAction: build.mutation({
        query: ({ projectId, bindingId, ...body }) => ({
          url: `/elitea_core/agent_identity_action/default/${project(projectId)}/${encodeURIComponent(bindingId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: tags,
      }),
      getProjectReferences: build.query({
        query: ({ projectId, state }) => ({
          url: `/secrets/credential_references/default/${project(projectId)}`,
          params: { limit: LIST_LIMIT, ...(state && { state }) },
        }),
        providesTags: tags,
      }),
      projectReferenceAction: build.mutation({
        query: ({ projectId, referenceId, ...body }) => ({
          url: `/secrets/credential_reference_action/default/${project(projectId)}/${encodeURIComponent(referenceId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: tags,
      }),
      getProjectGrants: build.query({
        query: ({ projectId, state }) => ({
          url: `/secrets/credential_grants/default/${project(projectId)}`,
          params: { limit: LIST_LIMIT, ...(state && { state }) },
        }),
        providesTags: tags,
      }),
      projectGrantAction: build.mutation({
        query: ({ projectId, grantId, ...body }) => ({
          url: `/secrets/credential_grant_action/default/${project(projectId)}/${encodeURIComponent(grantId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: tags,
      }),
      getProjectMandates: build.query({
        query: ({ projectId, state }) => ({
          url: `/elitea_core/autonomous_mandates/default/${project(projectId)}`,
          params: { limit: LIST_LIMIT, ...(state && { state }) },
        }),
        providesTags: tags,
      }),
      projectMandateAction: build.mutation({
        query: ({ projectId, mandateId, ...body }) => ({
          url: `/elitea_core/autonomous_mandate_action/default/${project(projectId)}/${encodeURIComponent(mandateId)}`,
          method: 'POST',
          body,
        }),
        invalidatesTags: tags,
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
} = projectGovernanceApi;
