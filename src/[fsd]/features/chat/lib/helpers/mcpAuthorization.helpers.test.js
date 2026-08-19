import { describe, expect, it } from 'vitest';

import { ToolActionStatus } from '@/common/constants';

import {
  buildMcpAuthorizationToolAction,
  buildToolkitAuthorizationDecline,
  buildToolkitAuthorizationMessage,
  getMcpAuthorizationRequests,
  getToolkitAuthorizationContext,
  groupToolkitAuthorizationActions,
  hasProcessingSiblingForAuthorization,
} from './mcpAuthorization.helpers';

describe('toolkit authorization helpers', () => {
  it('keeps every distinct pending request and replaces replay duplicates by exact invocation id', () => {
    const requests = getMcpAuthorizationRequests({
      authorization_requests: [
        { tool_run_id: 'call-1', tool_name: 'first' },
        { tool_run_id: 'call-2', tool_name: 'second' },
        { tool_run_id: 'call-1', tool_name: 'first-replayed' },
        { tool_name: 'missing-identity' },
      ],
    });

    expect(requests).toEqual([
      { tool_run_id: 'call-1', tool_name: 'first-replayed' },
      { tool_run_id: 'call-2', tool_name: 'second' },
    ]);
  });

  it('builds one exact SharePoint authorization action without persisting credentials', () => {
    const action = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'call-sharepoint-1',
        tool_name: 'search_files',
        toolkit_name: 'team-documents',
        toolkit_type: 'sharepoint',
        server_url: 'https://sharepoint.example/mcp',
        resource_metadata_url: 'https://sharepoint.example/.well-known/oauth-protected-resource',
        resource_metadata: {
          resource_name: 'SharePoint',
          configuration_uuid: 'configuration-1',
          authorization_servers: ['https://login.example/tenant'],
          scopes_supported: ['Files.Read'],
          oauth_authorization_server: {
            token_endpoint: 'https://login.example/tenant/token',
            id_token: 'must-not-be-rendered',
          },
          provided_settings: {
            mcp_client_id: 'must-not-be-rendered',
            mcp_client_secret: 'must-not-be-rendered',
          },
        },
        metadata: {
          parent_agent_name: 'Researcher',
          parent_agent_call_id: 'agent-call-1',
          parent_agent_path: [
            { name: 'Coordinator', call_id: 'root-call-1' },
            { name: 'Researcher', call_id: 'agent-call-1' },
          ],
        },
        provided_settings: { access_token: 'must-not-be-rendered' },
      },
      createdAt: '2026-08-06T12:00:00Z',
    });

    expect(action).toMatchObject({
      id: 'call-sharepoint-1',
      authorizationRequestId: 'call-sharepoint-1',
      status: ToolActionStatus.actionRequired,
      name: 'search_files',
      parent_agent_name: 'Researcher',
      parent_agent_call_id: 'agent-call-1',
      toolOutputs: {
        server_url: 'configuration-1:https://login.example/tenant',
        toolkit_name: 'team-documents',
        toolkit_type: 'sharepoint',
      },
    });
    expect(action.toolOutputs).not.toHaveProperty('provided_settings');
    expect(action.toolMeta).not.toHaveProperty('provided_settings');
    expect(action.toolMeta.resource_metadata).not.toHaveProperty('provided_settings');
    expect(action.toolMeta.resource_metadata.oauth_authorization_server).toEqual({
      token_endpoint: 'https://login.example/tenant/token',
    });
    expect(action.content).not.toContain('must-not-be-rendered');

    expect(getToolkitAuthorizationContext(action, 'fallback-agent')).toEqual({
      toolkitName: 'team-documents',
      toolkitType: 'SharePoint',
      originatorName: 'Researcher',
      originatorPath: ['Coordinator', 'Researcher'],
      serverUrl: 'https://sharepoint.example/mcp',
      resourceMetadataUrl: 'https://sharepoint.example/.well-known/oauth-protected-resource',
      authorizationServers: ['https://login.example/tenant'],
      scopes: ['Files.Read'],
    });

    expect(buildToolkitAuthorizationDecline(action)).toEqual({
      server_url: 'https://sharepoint.example/mcp',
      tool_name: 'search_files',
      toolkit_type: 'sharepoint',
      skip_reason: 'User skipped MCP login for this run.',
    });

    expect(buildToolkitAuthorizationMessage(getToolkitAuthorizationContext(action, 'fallback-agent'))).toBe(
      'Authorization is required for toolkit "team-documents". Authorize now or skip it for this run?',
    );
  });

  it('keeps direct cards flat and groups delegated authorization by full origin path', () => {
    const direct = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'direct-call',
        tool_name: 'list_direct',
        toolkit_name: 'direct-toolkit',
        server_url: 'https://direct.example',
        authorization_servers: ['https://login.example'],
      },
    });
    const nested = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'nested-call',
        tool_name: 'list_nested',
        toolkit_name: 'nested-toolkit',
        server_url: 'https://nested.example',
        authorization_servers: ['https://login.example'],
        metadata: {
          parent_agent_name: 'Leaf',
          parent_agent_call_id: 'leaf-call',
          parent_agent_path: [
            { name: 'Orchestrator', call_id: 'orchestrator-call' },
            { name: 'Suborchestrator', call_id: 'suborchestrator-call' },
            { name: 'Leaf', call_id: 'leaf-call' },
          ],
        },
      },
    });

    const grouped = groupToolkitAuthorizationActions([direct, nested], [direct, nested]);

    expect(getToolkitAuthorizationContext(direct, 'root-agent')).toMatchObject({
      toolkitName: 'direct-toolkit',
      originatorName: '',
      originatorPath: [],
    });
    expect(buildToolkitAuthorizationMessage(getToolkitAuthorizationContext(direct, 'root-agent'))).toBe(
      'Authorization is required for toolkit "direct-toolkit". Authorize now or skip it for this run?',
    );

    expect(grouped.coordinator).toEqual([direct]);
    expect(grouped.subAgents).toHaveLength(1);
    expect(grouped.subAgents[0]).toMatchObject({
      name: 'Leaf',
      label: 'Orchestrator ▸ Suborchestrator ▸ Leaf',
      actions: [nested],
    });
  });

  it('reports an actionable error when a server omits OAuth discovery metadata', () => {
    const action = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'call-broken-1',
        tool_name: 'list_items',
        server_url: 'https://broken.example/mcp',
        status: 401,
      },
    });

    expect(action.status).toBe(ToolActionStatus.error);
    expect(action.content).toContain('did not provide authorization server configuration');
  });

  it('detects a processing parallel sibling for nested authorization', () => {
    const parent = { name: 'Full Name Resolver', call_id: 'full-name-call' };
    const authorization = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'surname-auth',
        tool_name: 'sharepoint',
        authorization_servers: ['https://login.example'],
        metadata: {
          parent_agent_path: [parent, { name: 'Surname Resolver', call_id: 'surname-call' }],
        },
      },
    });
    const processingNameResolver = {
      id: 'name-llm',
      status: ToolActionStatus.processing,
      parent_agent_path: [parent, { name: 'Name Resolver', call_id: 'name-call' }],
    };

    expect(
      hasProcessingSiblingForAuthorization([authorization, processingNameResolver], [authorization]),
    ).toBe(true);
  });

  it('does not treat an ancestor, completed sibling, or direct auth as processing sibling work', () => {
    const parent = { name: 'Full Name Resolver', call_id: 'full-name-call' };
    const nestedAuthorization = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'surname-auth',
        tool_name: 'sharepoint',
        authorization_servers: ['https://login.example'],
        metadata: {
          parent_agent_path: [parent, { name: 'Surname Resolver', call_id: 'surname-call' }],
        },
      },
    });
    const ancestor = {
      id: 'parent-wrapper',
      status: ToolActionStatus.processing,
      parent_agent_path: [parent],
    };
    const completedSibling = {
      id: 'name-complete',
      status: ToolActionStatus.complete,
      parent_agent_path: [parent, { name: 'Name Resolver', call_id: 'name-call' }],
    };
    const directAuthorization = buildMcpAuthorizationToolAction({
      metadata: {
        tool_run_id: 'direct-auth',
        tool_name: 'sharepoint',
        authorization_servers: ['https://login.example'],
      },
    });

    expect(
      hasProcessingSiblingForAuthorization(
        [nestedAuthorization, ancestor, completedSibling],
        [nestedAuthorization],
      ),
    ).toBe(false);
    expect(hasProcessingSiblingForAuthorization([directAuthorization, ancestor], [directAuthorization])).toBe(
      false,
    );
  });
});
