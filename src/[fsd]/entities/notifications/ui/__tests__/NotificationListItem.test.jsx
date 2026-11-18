// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import NotificationListItem from '../NotificationListItem';

const { bulkMarkSeenNotifications } = vi.hoisted(() => ({
  bulkMarkSeenNotifications: vi.fn(() => ({ unwrap: vi.fn().mockResolvedValue({}) })),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useToast: () => ({ toastError: vi.fn() }),
}));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 9 } }),
}));
vi.mock('@/api/notifications', () => ({
  useNotificationBulkMarkSeenMutation: () => [bulkMarkSeenNotifications],
}));
vi.mock('@/common/convertChatConversationMessages', () => ({ convertTime: value => value }));
vi.mock('@/common/utils', () => ({ buildErrorMessage: () => 'error' }));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));
vi.mock('../../lib/helpers', async importOriginal => ({ ...(await importOriginal()), getIcon: () => null }));
vi.mock('../NotificationListItemMessage', () => ({ default: () => <span>message</span> }));

const notification = {
  id: 1,
  event_type: 'schedule_approval_needed',
  is_seen: false,
  created_at: '2026-10-30T10:00:00Z',
};

const renderItem = context =>
  render(
    <ThemeProvider
      theme={createTheme({
        palette: {
          components: { notificationItem: { border: '#ccc' } },
          background: { surface: { interactive: { default: '#eee' } } },
        },
      })}
    >
      <NotificationListItem
        notification={notification}
        context={context}
      />
    </ThemeProvider>,
  );

describe('NotificationListItem', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('keeps the mark button in the layout without a hover so the text width does not change', () => {
    renderItem('list');
    expect(screen.getByRole('button', { name: 'Mark as read' })).toBeInTheDocument();
  });

  it('has no mark button in the table context', () => {
    renderItem('table');
    expect(screen.queryByRole('button', { name: 'Mark as read' })).not.toBeInTheDocument();
  });

  it('marks a notification using the personal project ID', () => {
    renderItem('list');
    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }));

    expect(bulkMarkSeenNotifications).toHaveBeenCalledWith({
      projectId: 9,
      ids: [notification.id],
      isSeen: true,
    });
  });
});
