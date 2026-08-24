// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useDelegatedOauthToolkits } from '../useDelegatedOauthToolkits.hooks';

const shared = vi.hoisted(() => ({ configsByProjectAndType: {} }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 'personal-1' } }),
}));

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    isPrebuildMcpType: type => typeof type === 'string' && type.startsWith('mcp_') && type !== 'mcp',
  },
}));

vi.mock('@/api/configurations', () => ({
  useGetConfigurationsByTypeQuery: ({ projectId, type }, { skip } = {}) => ({
    data: skip ? undefined : { items: shared.configsByProjectAndType[`${projectId}:${type}`] ?? [] },
  }),
}));

const PROJECT_ID = 'project-1';

const renderWith = tools => renderHook(() => useDelegatedOauthToolkits(tools, PROJECT_ID)).result.current;

describe('useDelegatedOauthToolkits', () => {
  beforeEach(() => {
    shared.configsByProjectAndType = {};
  });

  it('reports no delegated toolkits for an empty or missing tool list', () => {
    expect(renderWith(undefined).hasDelegatedOauthToolkit).toBe(false);
    expect(renderWith([]).hasDelegatedOauthToolkit).toBe(false);
  });

  it('ignores toolkits that authenticate with service credentials', () => {
    expect(renderWith([{ name: 'Jira', type: 'jira' }]).delegatedOauthToolkitNames).toEqual([]);
  });

  it('detects remote and pre-built MCP toolkits', () => {
    const { delegatedOauthToolkitNames } = renderWith([
      { name: 'Remote', type: 'mcp' },
      { name: 'GitHub MCP', type: 'mcp_github' },
      { name: 'Wrapped', type: 'custom', meta: { mcp: true } },
    ]);

    expect(delegatedOauthToolkitNames).toEqual(['Remote', 'GitHub MCP', 'Wrapped']);
  });

  it('detects SharePoint only when its credential has an OAuth discovery endpoint', () => {
    shared.configsByProjectAndType[`${PROJECT_ID}:sharepoint`] = [
      { elitea_title: 'delegated', data: { oauth_discovery_endpoint: 'https://login/.well-known' } },
      { elitea_title: 'app-only', data: {} },
    ];

    const tools = [
      {
        name: 'SP Delegated',
        type: 'sharepoint',
        settings: { sharepoint_configuration: { elitea_title: 'delegated' } },
      },
      {
        name: 'SP App',
        type: 'sharepoint',
        settings: { sharepoint_configuration: { elitea_title: 'app-only' } },
      },
    ];

    expect(renderWith(tools).delegatedOauthToolkitNames).toEqual(['SP Delegated']);
  });

  it('resolves private credential references against the personal project', () => {
    shared.configsByProjectAndType['personal-1:sharepoint'] = [
      { elitea_title: 'mine', data: { oauth_discovery_endpoint: 'https://login/.well-known' } },
    ];

    const tools = [
      {
        name: 'SP Private',
        type: 'sharepoint',
        settings: { sharepoint_configuration: { elitea_title: 'mine', private: true } },
      },
    ];

    expect(renderWith(tools).hasDelegatedOauthToolkit).toBe(true);
  });

  it('detects OpenAPI configured with a direct OAuth discovery endpoint', () => {
    const tools = [
      {
        name: 'Petstore',
        type: 'openapi',
        settings: { oauth_discovery_endpoint: 'https://auth/.well-known' },
      },
    ];

    expect(renderWith(tools).delegatedOauthToolkitNames).toEqual(['Petstore']);
  });
});
