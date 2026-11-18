// @vitest-environment jsdom
import { MemoryRouter, useLocation, useSearchParams } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

const pending = vi.hoisted(() => ({ resolve: null }));
const stable = vi.hoisted(() => ({
  dispatch: () => {
    const request = new Promise(resolve => {
      pending.resolve = resolve;
    });
    request.unsubscribe = () => {};
    return request;
  },
  toast: { toastError: () => {} },
  onRunConversationChange: () => {},
}));

vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useDispatch: () => stable.dispatch,
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => stable.toast,
}));

const { useOpenRunVersion } = await import('../useOpenRunVersion.hooks');

const renderOnPage = url => {
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  return renderHook(
    () => ({
      openRunVersion: useOpenRunVersion({
        projectId: 2,
        skillId: '7',
        tab: 'all',
        onRunConversationChange: stable.onRunConversationChange,
      }),
      searchParamsState: useSearchParams(),
      location: useLocation(),
    }),
    { wrapper },
  ).result;
};

describe('useOpenRunVersion', () => {
  afterEach(() => cleanup());

  it('keeps the same callback while the address changes', () => {
    const result = renderOnPage('/skills/all/7/70');
    const first = result.current.openRunVersion;

    act(() => result.current.searchParamsState[1]({ view: 'files', panel: 'test' }));

    expect(result.current.openRunVersion).toBe(first);
  });

  it('opens the run with the tab and panel current when the version is confirmed', async () => {
    const result = renderOnPage('/skills/all/7/70?file=a.md');
    let opening;
    act(() => {
      opening = result.current.openRunVersion(71, 5);
    });
    act(() => result.current.searchParamsState[1]({ view: 'files', panel: 'instructions', file: 'a.md' }));

    await act(async () => {
      pending.resolve({});
      await opening;
    });

    expect(result.current.location.pathname).toBe('/skills/all/7/71');
    expect(result.current.location.search).toBe('?run=5&view=files&panel=instructions');
  });
});
