// @vitest-environment jsdom
import { RouterProvider, createMemoryRouter, useBlocker } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SIDEBAR_COLLAPSE_STATE_KEY } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import { actions as settingsActions } from '@/slices/settings';
import { act, cleanup, render } from '@testing-library/react';

import { useCollapseAfterSidebarNavigation } from '../useCollapseAfterSidebarNavigation.hooks';

const fixture = vi.hoisted(() => ({ dispatch: vi.fn(), block: false, blocker: null }));

vi.mock('react-redux', () => ({ useDispatch: () => fixture.dispatch }));

const COLLAPSE = settingsActions.setSideBarCollapsed(true);

const Layout = () => {
  useCollapseAfterSidebarNavigation();
  fixture.blocker = useBlocker(() => fixture.block);
  return null;
};

const renderRouter = () => {
  const router = createMemoryRouter(
    [
      { path: '/agents/*', element: <Layout /> },
      { path: '/pipelines', element: <Layout /> },
      { path: '/skills', element: <Layout /> },
    ],
    { initialEntries: ['/agents/all'] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const pick = (router, path, id = 1) =>
  act(() => router.navigate(path, { state: { routeStack: [], [SIDEBAR_COLLAPSE_STATE_KEY]: id } }));

describe('useCollapseAfterSidebarNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.block = false;
  });
  afterEach(() => cleanup());

  it('folds the menu once the picked section has opened', async () => {
    const router = renderRouter();
    await pick(router, '/pipelines');
    expect(fixture.dispatch).toHaveBeenCalledTimes(1);
    expect(fixture.dispatch).toHaveBeenCalledWith(COLLAPSE);
  });

  it('does not fold for navigations without a pick', async () => {
    const router = renderRouter();
    await act(() => router.navigate('/pipelines', { state: { routeStack: [] } }));
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it('folds once per pick, even when a page carries the state into its own navigations', async () => {
    const router = renderRouter();
    await pick(router, '/pipelines', 7);
    await pick(router, '/skills', 7);
    await act(() => router.navigate('/pipelines', { replace: true, state: router.state.location.state }));
    expect(fixture.dispatch).toHaveBeenCalledTimes(1);

    await pick(router, '/skills', 8);
    expect(fixture.dispatch).toHaveBeenCalledTimes(2);
  });

  it('folds after a redirect that keeps the state (REPLACE)', async () => {
    const router = renderRouter();
    await act(() =>
      router.navigate('/skills', { replace: true, state: { [SIDEBAR_COLLAPSE_STATE_KEY]: 3 } }),
    );
    expect(fixture.dispatch).toHaveBeenCalledWith(COLLAPSE);
  });

  it('does not fold on Back / Forward to a picked entry', async () => {
    const router = renderRouter();
    await pick(router, '/pipelines', 1);
    await act(() => router.navigate('/skills'));
    fixture.dispatch.mockClear();

    // A fresh mount (e.g. a reload) has not handled the entry yet, so only the POP rule stops it
    cleanup();
    const reloaded = createMemoryRouter([{ path: '*', element: <Layout /> }], {
      initialEntries: [{ pathname: '/pipelines', state: { [SIDEBAR_COLLAPSE_STATE_KEY]: 1 } }, '/skills'],
      initialIndex: 1,
    });
    render(<RouterProvider router={reloaded} />);
    await act(() => reloaded.navigate(-1));
    expect(reloaded.state.location.pathname).toBe('/pipelines');
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it('keeps the menu when a guard cancels the navigation, folds when the user leaves', async () => {
    const router = renderRouter();
    fixture.block = true;
    await pick(router, '/pipelines', 5);
    expect(fixture.blocker.state).toBe('blocked');

    await act(() => fixture.blocker.reset());
    expect(router.state.location.pathname).toBe('/agents/all');
    expect(fixture.dispatch).not.toHaveBeenCalled();

    await pick(router, '/pipelines', 6);
    await act(() => fixture.blocker.proceed());
    expect(router.state.location.pathname).toBe('/pipelines');
    expect(fixture.dispatch).toHaveBeenCalledTimes(1);
  });
});
