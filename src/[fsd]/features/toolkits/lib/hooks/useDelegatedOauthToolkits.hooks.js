import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useGetConfigurationsByTypeQuery } from '@/api/configurations';

// Toolkit types whose credential may be configured either with delegated (per-user) OAuth or with
// service credentials. Only the delegated variant needs the interactive login, so the credential
// referenced by the toolkit has to be resolved before deciding.
const CREDENTIAL_RESOLVED_TYPES = ['sharepoint', 'openapi'];

const isMcpToolkit = tool =>
  tool?.type === 'mcp' || Boolean(tool?.meta?.mcp) || McpAuthHelpers.isPrebuildMcpType(tool?.type);

const getConfigRef = tool => tool?.settings?.[`${tool.type}_configuration`];

const hasOauthCredential = (tool, configsByProject) => {
  const configRef = getConfigRef(tool);

  // A referenced credential is authoritative: an app-only credential must not be reported as delegated
  // just because an endpoint lingers in the toolkit's own settings.
  if (configRef?.elitea_title) {
    const configs = configsByProject[configRef.private ? 'personal' : 'project']?.[tool.type] ?? [];
    const cred = configs.find(item => item.elitea_title === configRef.elitea_title);
    return Boolean(cred?.data?.oauth_discovery_endpoint);
  }

  // Only OpenAPI can carry the endpoint inline instead of referencing a credential.
  return tool?.type === 'openapi' && Boolean(tool?.settings?.oauth_discovery_endpoint);
};

/**
 * Names of the toolkits in `tools` that authenticate through a per-user OAuth login (remote/pre-built
 * MCP servers, SharePoint and OpenAPI credentials with an OAuth discovery endpoint). Their tokens are
 * bound to the browser session of the person who logged in, so such toolkits cannot run unattended.
 *
 * @param {Array} tools toolkits attached to an agent or pipeline version
 * @param {string} projectId project owning the entity
 * @returns {{ delegatedOauthToolkitNames: string[], hasDelegatedOauthToolkit: boolean,
 *   isResolvingCredentials: boolean }}
 */
export const useDelegatedOauthToolkits = (tools, projectId) => {
  const { personal_project_id: personalProjectId } = useSelector(state => state.user);

  const pendingTypes = useMemo(() => {
    const types = new Set();
    (tools || []).forEach(tool => {
      if (CREDENTIAL_RESOLVED_TYPES.includes(tool?.type) && getConfigRef(tool)?.elitea_title) {
        types.add(`${getConfigRef(tool).private ? 'personal' : 'project'}:${tool.type}`);
      }
    });
    return types;
  }, [tools]);

  const { data: projectSharepoint, isLoading: isLoadingProjectSharepoint } = useGetConfigurationsByTypeQuery(
    { projectId, type: 'sharepoint' },
    { skip: !projectId || !pendingTypes.has('project:sharepoint') },
  );
  const { data: personalSharepoint, isLoading: isLoadingPersonalSharepoint } =
    useGetConfigurationsByTypeQuery(
      { projectId: personalProjectId, type: 'sharepoint' },
      { skip: !personalProjectId || !pendingTypes.has('personal:sharepoint') },
    );
  const { data: projectOpenApi, isLoading: isLoadingProjectOpenApi } = useGetConfigurationsByTypeQuery(
    { projectId, type: 'openapi' },
    { skip: !projectId || !pendingTypes.has('project:openapi') },
  );
  const { data: personalOpenApi, isLoading: isLoadingPersonalOpenApi } = useGetConfigurationsByTypeQuery(
    { projectId: personalProjectId, type: 'openapi' },
    { skip: !personalProjectId || !pendingTypes.has('personal:openapi') },
  );

  const configsByProject = useMemo(
    () => ({
      project: { sharepoint: projectSharepoint?.items, openapi: projectOpenApi?.items },
      personal: { sharepoint: personalSharepoint?.items, openapi: personalOpenApi?.items },
    }),
    [projectSharepoint, projectOpenApi, personalSharepoint, personalOpenApi],
  );

  const delegatedOauthToolkitNames = useMemo(
    () =>
      (tools || [])
        .filter(
          tool =>
            isMcpToolkit(tool) ||
            (CREDENTIAL_RESOLVED_TYPES.includes(tool?.type) && hasOauthCredential(tool, configsByProject)),
        )
        .map(tool => tool?.name || tool?.type)
        .filter(Boolean),
    [tools, configsByProject],
  );

  return {
    delegatedOauthToolkitNames,
    hasDelegatedOauthToolkit: delegatedOauthToolkitNames.length > 0,
    // Callers acting on a change of the result (rather than just rendering it) must wait for this, since
    // credentials resolve after mount and the pre-resolution answer understates the delegated toolkits.
    isResolvingCredentials:
      isLoadingProjectSharepoint ||
      isLoadingPersonalSharepoint ||
      isLoadingProjectOpenApi ||
      isLoadingPersonalOpenApi,
  };
};
