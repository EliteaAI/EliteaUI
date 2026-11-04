// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useAgentInternalToolToggle } from '../useAgentInternalToolToggle.hooks';

const shared = vi.hoisted(() => ({ internalTools: [], setFieldValue: vi.fn() }));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { version_details: { meta: { internal_tools: shared.internalTools } } },
    setFieldValue: shared.setFieldValue,
  }),
}));

const FIELD = 'version_details.meta.internal_tools';

describe('useAgentInternalToolToggle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds the module when toggled on', () => {
    shared.internalTools = ['pyodide'];
    const { result } = renderHook(() => useAgentInternalToolToggle({ name: 'web_search' }));
    expect(result.current.checked).toBe(false);
    result.current.onToggle(true);
    expect(shared.setFieldValue).toHaveBeenCalledWith(FIELD, ['pyodide', 'web_search']);
  });

  it('does not duplicate an already enabled module', () => {
    shared.internalTools = ['web_search'];
    const { result } = renderHook(() => useAgentInternalToolToggle({ name: 'web_search' }));
    expect(result.current.checked).toBe(true);
    result.current.onToggle(true);
    expect(shared.setFieldValue).toHaveBeenCalledWith(FIELD, ['web_search']);
  });

  it('removes the module when toggled off', () => {
    shared.internalTools = ['web_search', 'pyodide'];
    const { result } = renderHook(() => useAgentInternalToolToggle({ name: 'web_search' }));
    result.current.onToggle(false);
    expect(shared.setFieldValue).toHaveBeenCalledWith(FIELD, ['pyodide']);
  });

  it('reports unchecked and ignores toggles when unavailable', () => {
    shared.internalTools = ['web_search'];
    const { result } = renderHook(() =>
      useAgentInternalToolToggle({ name: 'web_search', unavailable: true }),
    );
    expect(result.current.checked).toBe(false);
    result.current.onToggle(false);
    expect(shared.setFieldValue).not.toHaveBeenCalled();
  });
});
