// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useCollapsedSection, useExpandOnAttention, useSectionExpansion } from '../useSectionExpansion.hooks';

const renderExpansion = needsAttention =>
  renderHook(({ needsAttention: flag }) => useSectionExpansion(flag), {
    initialProps: { needsAttention },
  });

describe('useCollapsedSection', () => {
  it('starts collapsed and follows the accordion toggle', () => {
    const { result } = renderHook(() => useCollapsedSection());

    expect(result.current.isExpanded).toBe(false);

    act(() => result.current.toggleExpanded(null, true));

    expect(result.current.isExpanded).toBe(true);
  });
});

describe('useExpandOnAttention against a hoisted section', () => {
  const renderConsumer = (needsAttention, section) =>
    renderHook(() => useExpandOnAttention(needsAttention, section));

  it('expands a section owned by a parent', () => {
    const { result: section } = renderHook(() => useCollapsedSection());

    renderConsumer(true, section.current);

    expect(section.current.isExpanded).toBe(true);
  });

  it('keeps a manual collapse when the consumer remounts while attention persists', () => {
    const { result: section } = renderHook(() => useCollapsedSection());

    const firstConsumer = renderConsumer(true, section.current);
    act(() => section.current.toggleExpanded(null, false));
    firstConsumer.unmount();

    renderConsumer(true, section.current);

    expect(section.current.isExpanded).toBe(false);
  });

  it('still expands a remounted consumer when attention is new', () => {
    const { result: section } = renderHook(() => useCollapsedSection());

    renderConsumer(false, section.current).unmount();

    renderConsumer(true, section.current);

    expect(section.current.isExpanded).toBe(true);
  });
});

describe('useSectionExpansion', () => {
  it('starts collapsed when nothing needs attention', () => {
    const { result } = renderExpansion(false);

    expect(result.current.isExpanded).toBe(false);
  });

  it('starts expanded when something already needs attention on mount', () => {
    const { result } = renderExpansion(true);

    expect(result.current.isExpanded).toBe(true);
  });

  it('expands when attention becomes needed after mount', () => {
    const { result, rerender } = renderExpansion(false);

    expect(result.current.isExpanded).toBe(false);

    rerender({ needsAttention: true });

    expect(result.current.isExpanded).toBe(true);
  });

  it('keeps a manual collapse while attention is still needed', () => {
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
