// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import {
  CONFIGURATION_SECTION_KEY,
  TOOLS_SECTION_KEY,
  useCollapsedSection,
  useExpandOnAttention,
  useSectionExpansion,
} from '../useSectionExpansion.hooks';

const makeStore = () => {
  const store = {};
  return {
    getItem: key => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(k => delete store[k]);
    },
  };
};

let fakeStorage;

beforeEach(() => {
  fakeStorage = makeStore();
  vi.stubGlobal('localStorage', fakeStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderExpansion = needsAttention =>
  renderHook(({ needsAttention: flag }) => useSectionExpansion(flag), {
    initialProps: { needsAttention },
  });

describe('useCollapsedSection — no storage key', () => {
  it('starts expanded by default', () => {
    const { result } = renderHook(() => useCollapsedSection());
    expect(result.current.isExpanded).toBe(true);
  });

  it('starts collapsed when defaultExpanded is false', () => {
    const { result } = renderHook(() => useCollapsedSection(null, false));
    expect(result.current.isExpanded).toBe(false);
  });

  it('toggles via toggleExpanded', () => {
    const { result } = renderHook(() => useCollapsedSection());

    act(() => result.current.toggleExpanded(null, false));
    expect(result.current.isExpanded).toBe(false);

    act(() => result.current.toggleExpanded(null, true));
    expect(result.current.isExpanded).toBe(true);
  });

  it('sets directly via setIsExpanded', () => {
    const { result } = renderHook(() => useCollapsedSection());

    act(() => result.current.setIsExpanded(false));
    expect(result.current.isExpanded).toBe(false);
  });
});

describe('useCollapsedSection — with storage key', () => {
  it('reads initial state from localStorage when present', () => {
    fakeStorage.setItem(CONFIGURATION_SECTION_KEY, 'false');
    const { result } = renderHook(() => useCollapsedSection(CONFIGURATION_SECTION_KEY));
    expect(result.current.isExpanded).toBe(false);
  });

  it('falls back to defaultExpanded when localStorage has no entry', () => {
    const { result } = renderHook(() => useCollapsedSection(CONFIGURATION_SECTION_KEY));
    expect(result.current.isExpanded).toBe(true);
  });

  it('persists state to localStorage on toggle', () => {
    const { result } = renderHook(() => useCollapsedSection(CONFIGURATION_SECTION_KEY));

    act(() => result.current.toggleExpanded(null, false));

    expect(fakeStorage.getItem(CONFIGURATION_SECTION_KEY)).toBe('false');
    expect(result.current.isExpanded).toBe(false);
  });

  it('persists state to localStorage via setIsExpanded', () => {
    const { result } = renderHook(() => useCollapsedSection(TOOLS_SECTION_KEY));

    act(() => result.current.setIsExpanded(false));

    expect(fakeStorage.getItem(TOOLS_SECTION_KEY)).toBe('false');
  });

  it('two instances with the same key share the storage slot but have independent state', () => {
    const { result: a } = renderHook(() => useCollapsedSection(CONFIGURATION_SECTION_KEY));
    const { result: b } = renderHook(() => useCollapsedSection(CONFIGURATION_SECTION_KEY));

    act(() => a.current.setIsExpanded(false));

    expect(fakeStorage.getItem(CONFIGURATION_SECTION_KEY)).toBe('false');
    // b was initialised before the write — its React state remains true
    expect(b.current.isExpanded).toBe(true);
  });

  it('handles corrupt localStorage values by falling back to defaultExpanded', () => {
    fakeStorage.setItem(CONFIGURATION_SECTION_KEY, '{bad json}');
    const { result } = renderHook(() => useCollapsedSection(CONFIGURATION_SECTION_KEY));
    expect(result.current.isExpanded).toBe(true);
  });

  it('CONFIGURATION_SECTION_KEY and TOOLS_SECTION_KEY are distinct strings', () => {
    expect(CONFIGURATION_SECTION_KEY).not.toBe(TOOLS_SECTION_KEY);
  });
});

describe('useExpandOnAttention against a hoisted section', () => {
  const renderConsumer = (needsAttention, section) =>
    renderHook(() => useExpandOnAttention(needsAttention, section));

  it('expands a section owned by a parent', () => {
    const { result: section } = renderHook(() => useCollapsedSection(null, false));

    renderConsumer(true, section.current);

    expect(section.current.isExpanded).toBe(true);
  });

  it('keeps a manual collapse when the consumer remounts while attention persists', () => {
    const { result: section } = renderHook(() => useCollapsedSection(null, false));

    const firstConsumer = renderConsumer(true, section.current);
    act(() => section.current.toggleExpanded(null, false));
    firstConsumer.unmount();

    renderConsumer(true, section.current);

    expect(section.current.isExpanded).toBe(false);
  });

  it('still expands a remounted consumer when attention is new', () => {
    const { result: section } = renderHook(() => useCollapsedSection(null, false));

    renderConsumer(false, section.current).unmount();
    renderConsumer(true, section.current);

    expect(section.current.isExpanded).toBe(true);
  });
});

describe('useSectionExpansion', () => {
  it('starts expanded when nothing needs attention (default open)', () => {
    const { result } = renderExpansion(false);
    expect(result.current.isExpanded).toBe(true);
  });

  it('starts expanded when something needs attention on mount', () => {
    const { result } = renderExpansion(true);
    expect(result.current.isExpanded).toBe(true);
  });

  it('stays expanded when attention becomes needed after mount', () => {
    const { result, rerender } = renderExpansion(false);

    rerender({ needsAttention: true });

    expect(result.current.isExpanded).toBe(true);
  });

  it('expands when manually collapsed and attention fires for the first time', () => {
    const { result, rerender } = renderExpansion(false);

    act(() => result.current.toggleExpanded(null, false));
    expect(result.current.isExpanded).toBe(false);

    rerender({ needsAttention: true });

    expect(result.current.isExpanded).toBe(true);
  });

  it('keeps a manual collapse while attention is already known', () => {
    const { result, rerender } = renderExpansion(true);

    act(() => result.current.toggleExpanded(null, false));
    expect(result.current.isExpanded).toBe(false);

    rerender({ needsAttention: true });

    expect(result.current.isExpanded).toBe(false);
  });

  it('re-expands when attention clears and is needed again', () => {
    const { result, rerender } = renderExpansion(true);

    act(() => result.current.toggleExpanded(null, false));
    rerender({ needsAttention: false });
    rerender({ needsAttention: true });

    expect(result.current.isExpanded).toBe(true);
  });
});
