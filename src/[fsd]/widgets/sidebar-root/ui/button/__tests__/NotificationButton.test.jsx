// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sioEvents } from '@/common/constants';
import { act, cleanup, render, screen } from '@testing-library/react';

import NotificationButton from '../NotificationButton';

const mocks = vi.hoisted(() => ({ handlers: {}, listData: undefined }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 7 } }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/[fsd]/features/auth/lib/hooks', () => ({
  useSocket: (event, handler) => {
    mocks.handlers[event] = handler;
  },
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({
  SIDEBAR_TOUR_TARGET_IDS: { notifications: 'notifications' },
}));
vi.mock('@/[fsd]/widgets/sidebar-root/ui/NotificationList', () => ({ default: () => null }));
vi.mock('@/api/notifications', () => ({ useNotificationListQuery: () => ({ data: mocks.listData }) }));
vi.mock('@/components/Icons/BellIcon', () => ({
  default: ({ hasMessages }) => <span data-testid="bell">{hasMessages ? 'dot' : 'plain'}</span>,
}));
vi.mock('@mui/material', () => ({ Box: ({ children, onClick }) => <div onClick={onClick}>{children}</div> }));
vi.mock('@/routes', () => ({ default: { Chat: '/chat' } }));

// EL-7011 US-40: R1.1, the bell reacts to a pushed schedule notice
describe('NotificationButton schedule notice (EL-7011)', () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.handlers = {};
    mocks.listData = { total: 0 };
  });

  it('R1.1 TC-US40-01 lights the bell when a notice is pushed', () => {
    render(<NotificationButton />);
    expect(screen.getByTestId('bell').textContent).toBe('plain');
    act(() => mocks.handlers[sioEvents.notifications_notify]({ event_type: 'schedule_run_failed' }));
    expect(screen.getByTestId('bell').textContent).toBe('dot');
  });

  it('R1.1 TC-US40-02 keeps the bell lit when the stored list has unread rows', () => {
    mocks.listData = { total: 2 };
    render(<NotificationButton />);
    expect(screen.getByTestId('bell').textContent).toBe('dot');
  });

  it('R1.1 TC-US40-03 leaves the bell plain when nothing is pushed and nothing is unread', () => {
    render(<NotificationButton />);
    expect(screen.getByTestId('bell').textContent).toBe('plain');
    expect(Object.keys(mocks.handlers)).toEqual([sioEvents.notifications_notify]);
  });
});
