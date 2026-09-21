import { McpAuthFlowConstants } from '@/[fsd]/features/mcp/lib/constants';

const { MCP_OAUTH_FLOWS, PUBLIC_CLIENT_AUTH_METHOD, PKCE_CODE_CHALLENGE_METHOD } = McpAuthFlowConstants;

const listTokenEndpointAuthMethods = metadata => metadata?.token_endpoint_auth_methods_supported || [];

const checkSupportsPKCE = metadata =>
  metadata?.code_challenge_methods_supported?.includes(PKCE_CODE_CHALLENGE_METHOD) ?? false;

const checkIsOIDC = metadata => Boolean(metadata?.userinfo_endpoint);

const checkCanRegisterDynamically = (metadata, authMethods, supportsPKCE) => {
  const acceptsPublicClients =
    authMethods.length === 0 || authMethods.includes(PUBLIC_CLIENT_AUTH_METHOD) || supportsPKCE;
  return Boolean(metadata?.registration_endpoint) && acceptsPublicClients;
};

const selectAuthFlow = ({ canRegisterDynamically, isOIDC, supportsPKCE }) => {
  if (canRegisterDynamically) return MCP_OAUTH_FLOWS.DCR;
  if (isOIDC) return MCP_OAUTH_FLOWS.OIDC;
  if (supportsPKCE) return MCP_OAUTH_FLOWS.PKCE;
  return MCP_OAUTH_FLOWS.STANDARD;
};

const checkHasBackendClientId = providedSettings => Boolean(providedSettings?.mcp_client_id);

const checkHasBackendClientSecret = providedSettings =>
  Boolean(providedSettings?.mcp_client_secret || providedSettings?.has_mcp_client_secret);

export const getOAuthClientRequirements = (metadata, providedSettings) => {
  const authMethods = listTokenEndpointAuthMethods(metadata);
  const supportsPKCE = checkSupportsPKCE(metadata);
  const isOIDC = checkIsOIDC(metadata);
  const canRegisterDynamically = checkCanRegisterDynamically(metadata, authMethods, supportsPKCE);
  const authFlow = selectAuthFlow({ canRegisterDynamically, isOIDC, supportsPKCE });
  const isDynamicRegistration = authFlow === MCP_OAUTH_FLOWS.DCR;
  const requiresClientSecret = !isDynamicRegistration && !authMethods.includes(PUBLIC_CLIENT_AUTH_METHOD);
  const needClientSecret = requiresClientSecret && !checkHasBackendClientSecret(providedSettings);

  return {
    authFlow,
    supportsPKCE,
    isOIDC,
    requiresClientSecret,
    needClientId: !isDynamicRegistration && !checkHasBackendClientId(providedSettings),
    needClientSecret,
    isClientSecretMandatory: needClientSecret && !supportsPKCE,
  };
};
