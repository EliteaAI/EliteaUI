// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@/common/constants';
import { cleanup, renderHook } from '@testing-library/react';

import { useNewChat } from '../useNewChat.hooks';

const fixture = vi.hoisted(() => ({
  navigate: vi.fn(),
  pathname: '/agents',
  permissions: [],
  isCreating: false,
  disablePersonalSpace: false,
}));

vi.mock('react-redux', () => ({
  useSelector: select => select({ chat: { isCreatingNewConversation: fixture.isCreating } }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => fixture.navigate,
  useLocation: () => ({ pathname: fixture.pathname }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => fixture.permissions.includes(permission) }),
}));
vi.mock('@/[fsd]/widgets/sidebar-root/lib/hooks/useDisablePersonalSpace.hooks', () => ({
  useDisablePersonalSpace: () => ({ shouldDisablePersonalSpace: fixture.disablePersonalSpace }),
}));

const renderNewChat = (overrides = {}) => {
  Object.assign(fixture, {
    pathname: '/agents',
    permissions: [PERMISSIONS.chat.create],
    isCreating: false,
    disablePersonalSpace: false,
    ...overrides,
  });
  return renderHook(() => useNewChat()).result.current;
};

describe('useNewChat', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('opens a new chat draft', () => {
    renderNewChat().createNewChat();
    expect(fixture.navigate).toHaveBeenCalledWith(
      { pathname: '/chat', search: 'create=1' },
      {
        replace: false,
        state: { routeStack: [{ breadCrumb: 'Chat', viewMode: 'owner', pagePath: '/chat' }] },
      },
    );
  });

  it('replaces detail and create pages in the history', () => {
    renderNewChat({ pathname: '/credentials/edit/5' }).createNewChat();
    expect(fixture.navigate.mock.calls[0][1].replace).toBe(true);
    vi.clearAllMocks();
    renderNewChat({ pathname: '/pipelines/create' }).createNewChat();
    expect(fixture.navigate.mock.calls[0][1].replace).toBe(true);
  });

  it('is enabled with either chat permission', () => {
    expect(renderNewChat().isDisabled).toBe(false);
    expect(renderNewChat({ permissions: [PERMISSIONS.chat.folders.create] }).isDisabled).toBe(false);
  });

  it('is disabled without permission, while a chat is being created, or without a personal space', () => {
    expect(renderNewChat({ permissions: [] }).isDisabled).toBe(true);
    expect(renderNewChat({ isCreating: true }).isDisabled).toBe(true);
    expect(renderNewChat({ disablePersonalSpace: true }).isDisabled).toBe(true);
  });
});
