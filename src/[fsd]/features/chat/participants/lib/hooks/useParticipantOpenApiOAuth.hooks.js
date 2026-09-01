import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import { useResolvedOpenApiConfig } from '@/[fsd]/features/openapi/lib/hooks';

export const useParticipantOpenApiOAuth = ({
  participant,
  originalDetails,
  entity_meta,
  isToolkitParticipant,
}) => {
  const openApiConfigRef =
    isToolkitParticipant && participant.entity_settings?.toolkit_type === 'openapi'
      ? originalDetails?.settings?.openapi_configuration
      : null;

  const {
    openApiConfig,
    oauthEndpoint: resolvedOpenAPIEndpoint,
    tokenKey: resolvedOpenApiTokenKey,
  } = useResolvedOpenApiConfig(openApiConfigRef, entity_meta?.project_id);

  // Reference mode: toolkit stores a saved credential reference (has elitea_title).
  // Direct-settings mode: OAuth endpoint is stored inline in settings.
  const isReferenceMode = !!openApiConfigRef?.elitea_title;

  const openAPIOauthEndpoint = isReferenceMode
    ? resolvedOpenAPIEndpoint
    : (originalDetails?.settings?.oauth_discovery_endpoint ?? '');

  const openApiTokenKey = isReferenceMode ? resolvedOpenApiTokenKey : openAPIOauthEndpoint;

  const effectiveOpenApiConfig = isReferenceMode
    ? openApiConfig
    : openAPIOauthEndpoint
      ? (originalDetails?.settings ?? null)
      : null;

  const { isLoggedIn: openAPIOAuthLoggedIn } = useMcpTokenChange({ serverUrl: openApiTokenKey });
  const openApiOAuthLoggedOut = !!effectiveOpenApiConfig && !openAPIOAuthLoggedIn;

  return {
    openApiConfig: effectiveOpenApiConfig,
    openApiTokenKey,
    openAPIOAuthLoggedIn,
    openApiOAuthLoggedOut,
  };
};
