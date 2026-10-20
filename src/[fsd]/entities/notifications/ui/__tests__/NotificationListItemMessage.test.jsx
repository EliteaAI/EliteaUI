// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import NotificationListItemMessage from '../NotificationListItemMessage';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const theme = createTheme({ palette: lightPalette });

const renderMessage = notification =>
  render(
    <ThemeProvider theme={theme}>
      <NotificationListItemMessage notification={notification} />
    </ThemeProvider>,
  );

const build = (eventType, meta) => ({
  id: 1,
  project_id: 7,
  is_seen: false,
  event_type: eventType,
  meta: { message: 'Run of [Nightly sync]() failed', ...meta },
});

describe('EL-7011 US-40 R2.1 schedule notice link', () => {
  afterEach(cleanup);

  it('links a run event to the run of its schedule', () => {
    renderMessage(build('schedule_run_failed', { schedule_id: 12, conversation_id: 99 }));
    const link = screen.getByRole('link', { name: 'Nightly sync' });
    expect(link.getAttribute('href')).toMatch(/\/7\/schedules\/12\?history_run_id=99$/);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links an admin edit to the schedule without a run', () => {
    renderMessage(build('schedule_edited_by_admin', { schedule_id: 12 }));
    expect(screen.getByRole('link', { name: 'Nightly sync' }).getAttribute('href')).toMatch(
      /\/7\/schedules\/12$/,
    );
  });
});

describe('EL-7011 US-40 R1.4 and R2.5 schedule notice text', () => {
  afterEach(cleanup);

  it('shows the message of an owner change with the schedule name', () => {
    renderMessage(build('schedule_owner_changed', { schedule_id: 12 }));
    expect(screen.getByText('Nightly sync')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nightly sync' }).getAttribute('href')).toMatch(/\/7\/schedules$/);
  });

  it('shows plain text without a link when the notice has no schedule_id', () => {
    renderMessage(build('schedule_run_failed', { conversation_id: 99 }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/Nightly sync/)).toBeInTheDocument();
    expect(screen.getByText(/failed/)).toBeInTheDocument();
  });
});
