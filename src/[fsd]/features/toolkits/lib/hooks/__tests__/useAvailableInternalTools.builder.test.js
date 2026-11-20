// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useAvailableInternalTools } from '../useAvailableInternalTools.hooks';

const shared = vi.hoisted(() => ({ isMcpVisible: true, toolkitSchemas: {} }));

vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => ({ data: undefined }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsMcpVisible: () => shared.isMcpVisible,
  useSelectedProjectId: () => 3,
}));
vi.mock('../useGetCurrentToolkitSchemas.hooks', () => ({
  useGetCurrentToolkitSchemas: () => ({ toolkitSchemas: shared.toolkitSchemas }),
}));

const names = tools => tools.map(tool => tool.name);

describe('useAvailableInternalTools Elitea Builder (#7383)', () => {
  it('lists one Elitea Builder and none of the removed builder modules', () => {
    shared.isMcpVisible = true;
    const { result } = renderHook(() => useAvailableInternalTools());
    const builders = result.current.filter(tool => tool.icon === 'McpIcon');
    expect(names(builders)).toEqual(['elitea_builder']);
    expect(builders[0].title).toBe('Elitea Builder');
    expect(builders[0].infoTooltip.text).toBe(
      'Create and edit agents, pipelines, skills, project context and other project settings from the chat.',
    );
    for (const removed of ['internal_mcp', 'skill_builder', 'project_context_builder']) {
      expect(names(result.current)).not.toContain(removed);
    }
  });

  it('keeps the Agent & Pipeline Builder slot, before Ask User', () => {
    shared.isMcpVisible = true;
    const { result } = renderHook(() => useAvailableInternalTools());
    const list = names(result.current);
    expect(list.indexOf('elitea_builder')).toBe(list.indexOf('data_analysis') + 1);
  });

  it('hides Elitea Builder when MCP exposure is not visible', () => {
    shared.isMcpVisible = false;
    const { result } = renderHook(() => useAvailableInternalTools());
    expect(names(result.current)).not.toContain('elitea_builder');
  });
});
