// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useModelOptions } from '../useModelConfiguration.hooks';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

vi.mock('@/hooks/useToast', () => ({ default: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }) }));

const LLM_MODELS = [
  {
    name: 'gpt-5.6-luna',
    display_name: 'GPT-5.6-Luna',
    project_id: 1,
    description: 'Fast for everyday tasks',
    low_tier: true,
  },
  { name: 'gpt-6-astra', display_name: 'GPT-6-Astra', project_id: 1, high_tier: true },
];

describe('useModelOptions', () => {
  it('carries each LLM model description into the default and tier options', () => {
    const { result } = renderHook(() => useModelOptions({ configurations: LLM_MODELS }));

    expect(result.current.modelOptions.map(({ label, description }) => ({ label, description }))).toEqual([
      { label: 'GPT-5.6-Luna', description: 'Fast for everyday tasks' },
      { label: 'GPT-6-Astra', description: undefined },
    ]);
    expect(result.current.lowTierModelOptions[0].description).toBe('Fast for everyday tasks');
    expect(result.current.highTierModelOptions[0].description).toBeUndefined();
  });
});
