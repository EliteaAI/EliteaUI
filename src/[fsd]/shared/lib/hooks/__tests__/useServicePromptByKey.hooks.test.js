// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { act, renderHook, waitFor } from '@testing-library/react';

const mockTrigger = vi.fn();

vi.mock('@/api/configurations', () => ({
  useLazyGetConfigurationsListQuery: () => [
    mockTrigger,
    { isFetching: false, isLoading: false, error: undefined },
  ],
}));

const { useServicePromptByKey } = await import('../useServicePromptByKey.hooks');

const page = ({ items = [], shared = [], sharedTotal = shared.length }) =>
  Promise.resolve({ data: { items, shared: { items: shared, total: sharedTotal } } });

const makePrompt = (key, text) => ({ elitea_title: key, data: { key, prompt: text } });

describe('useServicePromptByKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds a key that sits beyond the first shared page', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => makePrompt(`other_${index}`, 'x'));
    const secondPage = [makePrompt('mermaid_quick_fix', 'FIX ME')];
    mockTrigger
      .mockResolvedValueOnce(page({ shared: firstPage, sharedTotal: 101 }))
      .mockResolvedValueOnce(page({ shared: secondPage, sharedTotal: 101 }));

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));

    await waitFor(() => expect(result.current.prompt).toBe('FIX ME'));
    expect(mockTrigger).toHaveBeenCalledTimes(2);
    expect(mockTrigger.mock.calls[1][0]).toMatchObject({ sharedOffset: 100, sharedLimit: 100 });
  });

  it('stops paging when the key is missing and the shared list is exhausted', async () => {
    mockTrigger.mockResolvedValueOnce(page({ shared: [makePrompt('other', 'x')], sharedTotal: 1 }));

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.prompt).toBe('');
    expect(mockTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not page shared results for the public project', async () => {
    mockTrigger.mockResolvedValueOnce(page({ items: [makePrompt('mermaid_quick_fix', 'LOCAL')] }));

    const { result } = renderHook(() => useServicePromptByKey(PUBLIC_PROJECT_ID, 'mermaid_quick_fix'));

    await waitFor(() => expect(result.current.prompt).toBe('LOCAL'));
    expect(mockTrigger).toHaveBeenCalledTimes(1);
    expect(mockTrigger.mock.calls[0][0].includeShared).toBe(false);
  });

  it('does nothing without a project or key', async () => {
    const { result } = renderHook(() => useServicePromptByKey(null, 'mermaid_quick_fix'));
    await act(async () => {});
    expect(mockTrigger).not.toHaveBeenCalled();
    expect(result.current.prompt).toBe('');
  });
});

describe('useServicePromptByKey errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes a failed request as an error instead of a missing prompt', async () => {
    const requestError = { status: 500 };
    mockTrigger.mockResolvedValueOnce({ error: requestError });

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(requestError);
    expect(result.current.prompt).toBe('');
  });

  it('exposes an error when a later shared page fails', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => makePrompt(`other_${index}`, 'x'));
    const requestError = { status: 503 };
    mockTrigger
      .mockResolvedValueOnce(page({ shared: firstPage, sharedTotal: 101 }))
      .mockResolvedValueOnce({ error: requestError });

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));

    await waitFor(() => expect(result.current.error).toBe(requestError));
    expect(result.current.prompt).toBe('');
  });

  it('clears the error when a retry succeeds', async () => {
    mockTrigger.mockResolvedValueOnce({ error: { status: 500 } });
    mockTrigger.mockResolvedValueOnce(page({ shared: [makePrompt('mermaid_quick_fix', 'FIX ME')] }));

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    let outcome;
    await act(async () => {
      outcome = await result.current.refetch();
    });

    expect(outcome.error).toBeNull();
    expect(outcome.config.data.prompt).toBe('FIX ME');
    expect(result.current.error).toBeNull();
    expect(result.current.prompt).toBe('FIX ME');
  });

  it('resolves refetch with the error when the retry also fails', async () => {
    const retryError = { status: 502 };
    mockTrigger.mockResolvedValueOnce({ error: { status: 500 } });
    mockTrigger.mockResolvedValueOnce({ error: retryError });

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    let outcome;
    await act(async () => {
      outcome = await result.current.refetch();
    });

    expect(outcome).toEqual({ config: null, error: retryError });
    expect(result.current.error).toBe(retryError);
  });
});

describe('useServicePromptByKey ensurePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the loaded prompt without another request', async () => {
    mockTrigger.mockResolvedValueOnce(page({ shared: [makePrompt('mermaid_quick_fix', 'FIX ME')] }));

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));
    await waitFor(() => expect(result.current.prompt).toBe('FIX ME'));

    let outcome;
    await act(async () => {
      outcome = await result.current.ensurePrompt();
    });

    expect(outcome).toEqual({ prompt: 'FIX ME', error: null });
    expect(mockTrigger).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the prompt is simply not there', async () => {
    mockTrigger.mockResolvedValueOnce(page({ shared: [makePrompt('other', 'x')] }));

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome;
    await act(async () => {
      outcome = await result.current.ensurePrompt();
    });

    expect(outcome).toEqual({ prompt: '', error: null });
    expect(mockTrigger).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed lookup and returns the prompt', async () => {
    mockTrigger.mockResolvedValueOnce({ error: { status: 500 } });
    mockTrigger.mockResolvedValueOnce(page({ shared: [makePrompt('mermaid_quick_fix', 'FIX ME')] }));

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    let outcome;
    await act(async () => {
      outcome = await result.current.ensurePrompt();
    });

    expect(outcome).toEqual({ prompt: 'FIX ME', error: null });
    expect(mockTrigger).toHaveBeenCalledTimes(2);
  });

  it('returns the error when the retry fails too', async () => {
    const retryError = { status: 502 };
    mockTrigger.mockResolvedValueOnce({ error: { status: 500 } });
    mockTrigger.mockResolvedValueOnce({ error: retryError });

    const { result } = renderHook(() => useServicePromptByKey(7, 'mermaid_quick_fix'));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    let outcome;
    await act(async () => {
      outcome = await result.current.ensurePrompt();
    });

    expect(outcome).toEqual({ prompt: '', error: retryError });
  });
});

describe('useServicePromptByKey key changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports loading on the first render for a new key and does not return the previous prompt', async () => {
    mockTrigger.mockResolvedValueOnce(page({ items: [makePrompt('key_a', 'PROMPT A')] }));
    mockTrigger.mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderHook(({ key }) => useServicePromptByKey(PUBLIC_PROJECT_ID, key), {
      initialProps: { key: 'key_a' },
    });
    await waitFor(() => expect(result.current.prompt).toBe('PROMPT A'));

    rerender({ key: 'key_b' });

    expect(result.current.prompt).toBe('');
    expect(result.current.isLoading).toBe(true);
  });

  it('ignores a slow lookup for an old key that finishes after the key changed', async () => {
    let resolveSlow;
    mockTrigger.mockReturnValueOnce(
      new Promise(resolve => {
        resolveSlow = resolve;
      }),
    );
    mockTrigger.mockResolvedValueOnce(page({ items: [makePrompt('key_b', 'PROMPT B')] }));

    const { result, rerender } = renderHook(({ key }) => useServicePromptByKey(PUBLIC_PROJECT_ID, key), {
      initialProps: { key: 'key_a' },
    });
    rerender({ key: 'key_b' });
    await waitFor(() => expect(result.current.prompt).toBe('PROMPT B'));

    await act(async () => {
      resolveSlow({ data: { items: [makePrompt('key_a', 'STALE A')], shared: { items: [], total: 0 } } });
    });

    expect(result.current.prompt).toBe('PROMPT B');
  });
});
