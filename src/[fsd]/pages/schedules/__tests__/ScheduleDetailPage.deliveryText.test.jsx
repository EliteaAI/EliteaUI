// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ScheduleDetailPage from '../ScheduleDetailPage';

// the Edit schedule page shows where a chat delivery goes, as text only

const mocks = vi.hoisted(() => ({ query: {} }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ scheduleId: '9' }),
  useLocation: () => ({ state: {} }),
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  buildScheduleHistoryLink: () => '/history',
  useGetScheduleQuery: () => mocks.query,
  useUpdateScheduleMutation: () => [vi.fn()],
  useRunScheduleMutation: () => [vi.fn()],
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 5 }));
vi.mock('@/[fsd]/shared/ui/schedule', () => ({
  ScheduleSettingsSection: () => null,
  StopOnDateField: () => null,
}));
vi.mock('../ScheduleDetailMenu', () => ({ default: () => null }));
vi.mock('@/[fsd]/features/schedule', () => ({
  ScheduleRunsPanel: () => null,
  ScheduleRunsSection: () => null,
  buildEditValues: () => ({ values: { cron: '0 0 * * 6', timezone: 'UTC' }, returnTo: '/list' }),
  useEntityScheduleRoute: () => ({}),
  useScheduleRunsView: () => ({}),
  ScheduleForm: ({ children }) =>
    children({ values: { cron: '0 0 * * 6', timezone: 'UTC' }, setFieldValue: vi.fn(), fieldError: () => '' }),
}));

const baseSchedule = { id: 9, name: 'Nightly', cron: '0 0 * * 6', timezone: 'UTC' };
const chatSchedule = conversationName => ({
  ...baseSchedule,
  delivery: { mode: 'conversation', conversation_uuid: 'c-1', conversation_name: conversationName },
});

describe('ScheduleDetailPage delivery text', () => {
  afterEach(() => {
    cleanup();
    mocks.query = {};
  });

  it('shows the chat name as plain text for a schedule that delivers to a chat', () => {
    mocks.query = { currentData: chatSchedule('Weekly report') };
    render(<ScheduleDetailPage />);

    expect(screen.getByTestId('schedule-delivery-target-text')).toHaveTextContent(
      'Delivers to chat: Weekly report',
    );
  });

  it('offers no control to change the delivery', () => {
    mocks.query = { currentData: chatSchedule('Weekly report') };
    render(<ScheduleDetailPage />);
    const text = screen.getByTestId('schedule-delivery-target-text');

    expect(within(text).queryAllByRole('textbox')).toHaveLength(0);
    expect(within(text).queryAllByRole('button')).toHaveLength(0);
    expect(within(text).queryAllByRole('combobox')).toHaveLength(0);
  });

  it('shows unavailable when the details carry no chat name', () => {
    mocks.query = { currentData: chatSchedule(undefined) };
    render(<ScheduleDetailPage />);

    expect(screen.getByTestId('schedule-delivery-target-text')).toHaveTextContent(
      'Delivers to chat: unavailable',
    );
  });

  it('shows no delivery text for a Run History schedule', () => {
    mocks.query = { currentData: { ...baseSchedule, delivery: { mode: 'run_history' } } };
    render(<ScheduleDetailPage />);

    expect(screen.queryByText(/Delivers to chat/)).not.toBeInTheDocument();
  });

  it('shows no delivery text when the details have no delivery', () => {
    mocks.query = { currentData: baseSchedule };
    render(<ScheduleDetailPage />);

    expect(screen.queryByText(/Delivers to chat/)).not.toBeInTheDocument();
  });
});
