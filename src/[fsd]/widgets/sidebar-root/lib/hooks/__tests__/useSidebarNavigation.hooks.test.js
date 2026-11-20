// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SIDEBAR_COLLAPSE_STATE_KEY } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import RouteDefinitions from '@/routes';
import { actions as settingsActions } from '@/slices/settings';
import { cleanup, renderHook } from '@testing-library/react';

import { useSidebarNavigation } from '../useSidebarNavigation.hooks';

const fixture = vi.hoisted(() => ({
  navigate: vi.fn(),
  dispatch: vi.fn(),
  pathname: '/agents/all',
  personalProjectId: 1,
}));

vi.mock('react-redux', () => ({
  useDispatch: () => fixture.dispatch,
  useSelector: select => select({ user: { personal_project_id: fixture.personalProjectId } }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => fixture.navigate,
  useLocation: () => ({ pathname: fixture.pathname }),
}));
vi.mock('@/hooks/useNavBlocker', () => ({
  default: () => ({
    isBlockNav: false,
    isStreaming: false,
    setIsResetApiState: vi.fn(),
    resetApiState: vi.fn(),
  }),
}));

const renderNavigation = (overrides = {}) => {
  Object.assign(fixture, { pathname: '/agents/all', personalProjectId: 1, ...overrides });
  return renderHook(() => useSidebarNavigation()).result.current;
};

describe('useSidebarNavigation', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('navigates with the route stack and no collapse id by default', () => {
    const event = { preventDefault: vi.fn() };
    renderNavigation().navigateToPage('/artifacts', 'Artifacts')(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(fixture.navigate).toHaveBeenCalledWith('/artifacts', {
      state: { routeStack: [{ breadCrumb: 'Artifacts', pagePath: '/artifacts' }] },
    });
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it('puts a collapse id into the navigation state for an Explore pick, without folding yet', () => {
    renderNavigation().navigateToPage('/pipelines', 'Pipelines', { collapseSidebar: true })();
    const { state } = fixture.navigate.mock.calls[0][1];
    expect(state.routeStack).toEqual([{ breadCrumb: 'Pipelines', pagePath: '/pipelines' }]);
    expect(state[SIDEBAR_COLLAPSE_STATE_KEY]).toEqual(expect.any(Number));
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it('folds right away when the picked section is already open', () => {
    renderNavigation({ pathname: '/skills' }).navigateToPage('/skills', 'Skills', {
      collapseSidebar: true,
    })();
    expect(fixture.navigate).not.toHaveBeenCalled();
    expect(fixture.dispatch).toHaveBeenCalledWith(settingsActions.setSideBarCollapsed(true));
  });

  it('sends a user without a personal project to Onboarding, without a collapse id', () => {
    renderNavigation({ personalProjectId: null }).navigateToPage('/skills', 'Skills', {
      collapseSidebar: true,
    })();
    expect(fixture.navigate).toHaveBeenCalledWith(RouteDefinitions.Onboarding);
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });
});
