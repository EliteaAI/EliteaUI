import { useMemo } from 'react';

import { useOAuthAppListQuery } from '@/[fsd]/features/credentials/api/oauthAppsApi';
import { OAuthAppHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

// Teams/Outlook/SharePoint auth subsections follow the admin's OAuth apps of their provider (#7149):
// a default app hides every choice, no usable app leaves only the user's own (Custom app) fields.
export const useOAuthAppSubsections = ({ credentialType, subsections = [], settings = {} }) => {
  const projectId = useSelectedProjectId();
  const hasAppSection = subsections.some(subsection => subsection.name === OAuthAppHelpers.OAUTH_APP_SECTION);
  const enabled = hasAppSection && OAuthAppHelpers.isOAuthAppCredentialType(credentialType);
  const { data, isFetching, isUninitialized } = useOAuthAppListQuery(
    { projectId, type: credentialType },
    { skip: !enabled || !projectId },
  );

  return useMemo(() => {
    if (!enabled) return { subsections, isResolving: false, mode: null };
    if (isFetching || isUninitialized) return { subsections, isResolving: true, mode: null };
    const mode = OAuthAppHelpers.resolveOAuthAppMode(data, settings);
    return {
      subsections: OAuthAppHelpers.filterOAuthAppSubsections(subsections, mode),
      isResolving: false,
      mode,
    };
  }, [data, enabled, isFetching, isUninitialized, settings, subsections]);
};
