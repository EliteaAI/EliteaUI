// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { NotificationType } from '@/common/constants';
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

describe('schedule notice link', () => {
  afterEach(cleanup);

  it('links a run event to the run of its schedule', () => {
    renderMessage(build('schedule_run_failed', { schedule_id: 12, conversation_id: 99 }));
    const link = screen.getByRole('link', { name: 'Nightly sync' });
    expect(link.getAttribute('href')).toMatch(/\/7\/settings\/schedules\/12\?history_run_id=99$/);
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('links an admin edit to the schedule without a run', () => {
    renderMessage(build('schedule_edited_by_admin', { schedule_id: 12 }));
    expect(screen.getByRole('link', { name: 'Nightly sync' }).getAttribute('href')).toMatch(
      /\/7\/settings\/schedules\/12$/,
    );
  });
});

describe('schedule notice text', () => {
  afterEach(cleanup);

  it('shows the message of an owner change with the schedule name', () => {
    renderMessage(build('schedule_owner_changed', { schedule_id: 12 }));
    expect(screen.getByText('Nightly sync')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nightly sync' }).getAttribute('href')).toMatch(
      /\/7\/settings\/schedules$/,
    );
  });

  it('shows plain text without a link when the notice has no schedule_id', () => {
    renderMessage(build('schedule_run_failed', { conversation_id: 99 }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText(/Nightly sync/)).toBeInTheDocument();
    expect(screen.getByText(/failed/)).toBeInTheDocument();
  });
});

describe('project membership notice text', () => {
  afterEach(cleanup);

  it('preserves the stored text of a legacy add notice with named users', () => {
    renderMessage(
      build(NotificationType.UserWasAddedToSomeProjectAsTeammate, {
        users: ['Alex'],
        project_name: 'P',
        message: 'Alex is added into P.',
      }),
    );

    expect(screen.getByText('Alex is added into P.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the full bracketed project name as the added-notice link', () => {
    const projectName = `${'A'.repeat(120)} [Research]`;
    const { container } = renderMessage(
      build(NotificationType.UserWasAddedToSomeProjectAsTeammate, {
        project_name: projectName,
        message: `You have been added to ${projectName} project.`,
      }),
    );

    expect(screen.getByRole('link', { name: projectName })).toHaveAttribute(
      'href',
      expect.stringMatching(/\/7\/chat$/),
    );
    expect(container.textContent).toBe(`You have been added to ${projectName} project.`);
  });

  it('renders a removed project name as plain text with no link', () => {
    const projectName = 'Research [Archive]';
    const { container } = renderMessage(
      build(NotificationType.UserWasRemovedFromProject, {
        project_name: projectName,
        message: `You have been removed from ${projectName} project.`,
      }),
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.textContent).toBe(`You have been removed from ${projectName} project.`);
  });
});
