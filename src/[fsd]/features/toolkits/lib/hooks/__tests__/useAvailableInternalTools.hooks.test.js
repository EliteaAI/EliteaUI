// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useAvailableInternalTools } from '../useAvailableInternalTools.hooks';

const shared = vi.hoisted(() => ({ platformSettings: undefined, queryArgs: null }));

vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: args => {
    shared.queryArgs = args;
    return { data: shared.platformSettings };
  },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsMcpVisible: () => true,
  useSelectedProjectId: () => 3,
}));
vi.mock('../useGetCurrentToolkitSchemas.hooks', () => ({
  useGetCurrentToolkitSchemas: () => ({ toolkitSchemas: {} }),
}));

const names = tools => tools.map(tool => tool.name);
const givenWebSearch = available => {
  shared.platformSettings = {
    tool_spend: { web_search: { available, reason: available ? null : 'no_toolkit' } },
  };
};

describe('useAvailableInternalTools web_search gate (#6982)', () => {
  beforeEach(() => {
    shared.platformSettings = undefined;
    shared.queryArgs = null;
  });

  it('asks platform settings for the selected project', () => {
    renderHook(() => useAvailableInternalTools());
    expect(shared.queryArgs).toEqual({ projectId: 3 });
  });

  it('lists web_search when available', () => {
    givenWebSearch(true);
    const { result } = renderHook(() => useAvailableInternalTools());
    const tool = result.current.find(t => t.name === 'web_search');
    expect(tool).toBeTruthy();
    expect(tool.unavailable).toBeUndefined();
  });

  it('hides web_search when unavailable and not active', () => {
    givenWebSearch(false);
    const { result } = renderHook(() => useAvailableInternalTools());
    expect(names(result.current)).not.toContain('web_search');
  });

  it('hides web_search before platform settings load', () => {
    const { result } = renderHook(() => useAvailableInternalTools());
    expect(names(result.current)).not.toContain('web_search');
  });

  it('keeps an already-active web_search listed but inactive, with the admin tooltip', () => {
    givenWebSearch(false);
    const { result } = renderHook(() => useAvailableInternalTools({ activeToolNames: ['web_search'] }));
    const tool = result.current.find(t => t.name === 'web_search');
    expect(tool.unavailable).toBe(true);
    expect(tool.unavailableTooltip).toMatch(/disabled by your administrator/);
  });

  it('leaves other modules untouched', () => {
    givenWebSearch(false);
    const { result } = renderHook(() => useAvailableInternalTools());
    expect(names(result.current)).toEqual(expect.arrayContaining(['data_analysis', 'pyodide']));
  });
});
