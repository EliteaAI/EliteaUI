import { TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';

import { getActionOwnerPath, normalizeExecutionHierarchy } from './executionHierarchy.helpers';
import { computeBreadcrumbs } from './subAgentGrouping.helpers';

const DEFAULT_AUTH_MESSAGE = 'Toolkit authorization is required.';
const PRIVATE_AUTHORIZATION_KEYS = new Set([
  'access_token',
  'authorization',
  'client_secret',
  'mcp_client_secret',
  'mcp_tokens',
  'provided_settings',
  'refresh_token',
]);

const stripPrivateAuthorizationFields = value => {
  if (Array.isArray(value)) return value.map(stripPrivateAuthorizationFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !PRIVATE_AUTHORIZATION_KEYS.has(key.toLowerCase()))
      .map(([key, item]) => [key, stripPrivateAuthorizationFields(item)]),
  );
};

const renderAuthorizationMessage = content => {
  if (typeof content === 'string') return content;
  try {
    return `\`\`\`json\n ${JSON.stringify(content, null, 2)}\n\`\`\``;
  } catch {
    return String(content);
  }
};

const uniqueAuthorizationRequests = requests => {
  const byId = new Map();
  requests.forEach(request => {
    const id = request?.tool_run_id;
    if (typeof id === 'string' && id) byId.set(id, request);
  });
  return [...byId.values()];
};

export const getMcpAuthorizationRequests = responseMetadata => {
  const pending = responseMetadata?.authorization_requests;
  if (Array.isArray(pending) && pending.length) return uniqueAuthorizationRequests(pending);
  return responseMetadata?.tool_run_id ? [responseMetadata] : [];
};

const getAuthorizationServers = metadata =>
  metadata?.resource_metadata?.authorization_servers || metadata?.authorization_servers || [];

const getTokenStorageKey = metadata => {
  const authorizationServers = getAuthorizationServers(metadata);
  const oauthEndpoint = authorizationServers[0];
  const resourceName = metadata?.resource_metadata?.resource_name;
  const configurationUuid = metadata?.resource_metadata?.configuration_uuid;
  const toolkitType = metadata?.toolkit_type;
  const serverUrl = metadata?.server_url;
  const isSharePoint = resourceName === 'SharePoint';
  const isOpenApi = resourceName === 'OpenAPI';
  const isPrebuiltMcp =
    typeof toolkitType === 'string' && toolkitType.startsWith('mcp_') && toolkitType !== 'mcp';

  if (isPrebuiltMcp) return toolkitType;
  if (configurationUuid && oauthEndpoint) return `${configurationUuid}:${oauthEndpoint}`;
  if (isSharePoint || isOpenApi) return oauthEndpoint || serverUrl;
  return serverUrl;
};

export const buildMcpAuthorizationToolAction = ({
  metadata,
  content = DEFAULT_AUTH_MESSAGE,
  createdAt,
  fallbackId,
}) => {
  const requestId = metadata?.tool_run_id;
  const actionId = requestId || fallbackId;
  if (!actionId) return null;

  const authorizationServers = getAuthorizationServers(metadata);
  const hasAuthorizationServers = authorizationServers.length > 0;
  const resourceMetadataUrl = metadata?.resource_metadata_url;
  const toolName = metadata?.tool_name || 'Toolkit';
  const serverUrl = metadata?.server_url || 'Toolkit server';
  const statusCode = metadata?.status || 401;
  const hierarchy = normalizeExecutionHierarchy(metadata?.metadata, metadata);
  const safeMetadata = stripPrivateAuthorizationFields(metadata || {});

  const renderedContent = hasAuthorizationServers
    ? `${renderAuthorizationMessage(content || DEFAULT_AUTH_MESSAGE)}${
        resourceMetadataUrl
          ? `\n\nResource metadata: ${resourceMetadataUrl}`
          : `\n\nAuthorization servers: ${authorizationServers.join(', ')}`
      }`
    : `${statusCode}: Authorization error in "${toolName}" toolkit.\n\nThe toolkit server at ${serverUrl} requires OAuth authorization, but did not provide authorization server configuration.`;

  return {
    name: toolName,
    id: actionId,
    authorizationRequestId: requestId || '',
    status: hasAuthorizationServers ? ToolActionStatus.actionRequired : ToolActionStatus.error,
    toolInputs: undefined,
    toolOutputs: hasAuthorizationServers
      ? {
          resource_metadata_url: resourceMetadataUrl || null,
          authorization_servers: authorizationServers,
          server_url: getTokenStorageKey(metadata),
          tool_name: toolName,
          toolkit_name: metadata?.toolkit_name || null,
          toolkit_type: metadata?.toolkit_type || null,
        }
      : undefined,
    toolMeta: { ...safeMetadata, ...hierarchy },
    ...hierarchy,
    created_at: createdAt,
    ended_at: createdAt,
    type: TOOL_ACTION_TYPES.Toolkit,
    markdown: false,
    renderHtml: false,
    content: renderedContent,
  };
};

export const buildToolkitAuthorizationDecline = action => {
  const outputs = action?.toolOutputs || {};
  const metadata = action?.toolMeta || {};
  const serverUrl = metadata.server_url || outputs.server_url;
  if (!serverUrl) return null;
  return {
    server_url: serverUrl,
    tool_name: outputs.tool_name || metadata.tool_name || action?.name || '',
    toolkit_type: outputs.toolkit_type || metadata.toolkit_type || null,
    skip_reason: outputs.skip_reason || outputs.denial_reason || 'User skipped MCP login for this run.',
  };
};

export const getToolkitAuthorizationContext = (action, participantName = '') => {
  const metadata = action?.toolMeta || {};
  const resourceName = metadata?.resource_metadata?.resource_name;
  const toolkitName =
    metadata.toolkit_name || action?.toolOutputs?.toolkit_name || resourceName || action?.name || 'Toolkit';
  const rawType = String(metadata.toolkit_type || action?.toolOutputs?.toolkit_type || resourceName || '');
  const normalizedType = rawType.toLowerCase();
  const toolkitType = normalizedType.includes('sharepoint')
    ? 'SharePoint'
    : normalizedType.includes('openapi') || normalizedType.includes('open_api')
      ? 'OpenAPI'
      : normalizedType.includes('mcp')
        ? 'Remote MCP'
        : rawType;
  const hierarchy = normalizeExecutionHierarchy(action, metadata?.metadata, metadata);
  const path = hierarchy.parent_agent_path || [];
  const originatorName = path.at(-1)?.name || hierarchy.parent_agent_name || participantName || '';
  const authorizationServers = getAuthorizationServers(metadata);
  const rawScopes = metadata?.resource_metadata?.scopes_supported || metadata?.scopes || [];
  const scopes = Array.isArray(rawScopes) ? rawScopes : rawScopes ? [rawScopes] : [];

  return {
    toolkitName,
    toolkitType,
    originatorName,
    originatorPath: path.map(tier => tier.name).filter(Boolean),
    serverUrl: metadata.server_url || '',
    resourceMetadataUrl: metadata.resource_metadata_url || '',
    authorizationServers,
    scopes,
  };
};

export const buildToolkitAuthorizationMessage = (context, fallbackMessage = DEFAULT_AUTH_MESSAGE) => {
  if (!context) return fallbackMessage;
  return `Authorization is required for toolkit "${context.toolkitName}". Authorize now or skip it for this run?`;
};

/**
 * Keep direct toolkit authorization cards flat while grouping delegated
 * requests under the same hierarchical execution accordion used by HITL.
 */
export const groupToolkitAuthorizationActions = (actions, contextActions = []) => {
  const coordinator = [];
  const order = [];
  const byInvocation = new Map();

  (actions || []).forEach(action => {
    const path = getActionOwnerPath(action);
    if (!path.length) {
      coordinator.push(action);
      return;
    }
    const hierarchy = normalizeExecutionHierarchy(action, action?.toolMeta);
    const key =
      hierarchy.parent_agent_call_id || JSON.stringify(path.map(({ name, call_id }) => [name, call_id]));
    if (!byInvocation.has(key)) {
      byInvocation.set(key, {
        instanceKey: key,
        name: path.at(-1)?.name || hierarchy.parent_agent_name,
        agentPath: path,
        actions: [],
      });
      order.push(key);
    }
    byInvocation.get(key).actions.push(action);
  });

  const breadcrumbEntries = order.map(key => ({
    instanceKey: key,
    agentPath: byInvocation.get(key).agentPath,
  }));
  const breadcrumbContext = (contextActions || [])
    .map((action, index) => ({
      instanceKey: `trace-${index}`,
      agentPath: getActionOwnerPath(action),
    }))
    .filter(entry => entry.agentPath.length);
  const labels = computeBreadcrumbs(breadcrumbEntries, breadcrumbContext);

  return {
    coordinator,
    subAgents: order.map(key => ({
      ...byInvocation.get(key),
      label: labels.get(key),
    })),
    hasSubAgents: order.length > 0,
  };
};
