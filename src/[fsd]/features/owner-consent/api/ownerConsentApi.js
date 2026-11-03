import { eliteaApi } from '@/api';

const apiSlicePath = '/elitea_core';

const TAG_OWNER_CONSENT = 'OWNER_CONSENT';
const TAG_MY_MANDATES = 'MY_MANDATES';

// The owner's consent to a holder that runs without them acting with their Microsoft sign-in:
// a scoped API token, or an autonomous mandate (a schedule's or a webhook's). Always the owner's own act, in their
// own session; the server checks it again.
export const ownerConsentApi = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_OWNER_CONSENT, TAG_MY_MANDATES] })
  .injectEndpoints({
    endpoints: build => ({
      // { allowed, linked, mandates, consents: { [tokenId]: { consented_at, credentials } } }; with projects also
      // candidates: the delegated credentials a consent for a token of those projects may name
      getOwnerConsentStatus: build.query({
        query: ({ projects } = {}) => ({
          url: `${apiSlicePath}/token_identity/default`,
          params: projects?.length ? { projects: [...projects].sort((a, b) => a - b).join(',') } : undefined,
        }),
        providesTags: [TAG_OWNER_CONSENT],
      }),
      // consent names the credentials it covers: [{ project_id, credential_ref }]
      tokenConsentAction: build.mutation({
        query: ({ tokenId, action, credentials }) => ({
          url: `${apiSlicePath}/token_identity/default`,
          method: 'POST',
          body:
            action === 'consent' ? { action, token_id: tokenId, credentials } : { action, token_id: tokenId },
        }),
        invalidatesTags: [TAG_OWNER_CONSENT],
      }),
      // The caller's own mandates in the project: { rows: [{ id, version, state, identity_source, consented }] }
      getMyMandates: build.query({
        query: ({ projectId }) => ({ url: `${apiSlicePath}/autonomous_mandates/prompt_lib/${projectId}` }),
        providesTags: (_, _error, { projectId }) => [{ type: TAG_MY_MANDATES, id: projectId }],
      }),
      mandateConsentAction: build.mutation({
        query: ({ projectId, mandateId, action }) => ({
          url: `${apiSlicePath}/autonomous_mandate_action/prompt_lib/${projectId}/${mandateId}`,
          method: 'POST',
          body: { action },
        }),
        invalidatesTags: (_, _error, { projectId }) => [{ type: TAG_MY_MANDATES, id: projectId }],
      }),
    }),
  });

export const {
  useGetOwnerConsentStatusQuery,
  useTokenConsentActionMutation,
  useGetMyMandatesQuery,
  useMandateConsentActionMutation,
} = ownerConsentApi;
