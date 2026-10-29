import { useMemo, useRef } from 'react';

import { useOAuthAppListQuery } from '@/[fsd]/features/credentials/api/oauthAppsApi';
import { OAuthAppHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

// Teams/Outlook/SharePoint auth subsections follow the admin's OAuth apps of their provider (#7149):
// a default app hides every choice, no usable app leaves only the user's own (Custom app) fields.
// The mode follows what the credential had when the form opened, never the edits: switching tabs
// clears the other tab's key field (client_id / oauth_app_id) and must not hide the tab left behind.
export const useOAuthAppSubsections = ({ credentialType, subsections = [], settings = {} }) => {
  const projectId = useSelectedProjectId();
  const openedSettings = useRef(settings).current;
  const hasAppSection = subsections.some(OAuthAppHelpers.isOAuthAppSection);
  const enabled = hasAppSection && OAuthAppHelpers.isOAuthAppCredentialType(credentialType);
  const { currentData: data, isFetching } = useOAuthAppListQuery(
    { projectId, type: credentialType },
    { skip: !enabled || !projectId },
  );

  return useMemo(() => {
    if (!enabled) return { subsections, isResolving: false, mode: null };
    // No project yet: nothing will load, so show the Custom app form rather than nothing
    if (!projectId) {
      const mode = OAuthAppHelpers.resolveOAuthAppMode(null, openedSettings);
      return {
        subsections: OAuthAppHelpers.filterOAuthAppSubsections(subsections, mode),
        isResolving: false,
        mode,
      };
    }
    // Hidden only until this project's apps first load; a background refetch keeps what the user is editing
    if (!data && isFetching) return { subsections, isResolving: true, mode: null };
    const mode = OAuthAppHelpers.resolveOAuthAppMode(data, openedSettings);
    return {
      subsections: OAuthAppHelpers.filterOAuthAppSubsections(subsections, mode),
      isResolving: false,
      mode,
    };
  }, [data, enabled, isFetching, openedSettings, projectId, subsections]);
};
