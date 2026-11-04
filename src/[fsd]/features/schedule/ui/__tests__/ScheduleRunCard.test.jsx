// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunCard from '../ScheduleRunCard';

// one compact run line and its open detail

vi.mock('../ScheduleRunDetail', () => ({ default: () => <div data-testid="detail-stub" /> }));

const theme = createTheme(getDesignTokens('light'));
const run = {
  id: 4,
  trigger: 'cron',
  status: 'success',
  started_at: '2026-10-21T09:00:00Z',
  version_id: 7,
  tokens: 1500,
};

const renderCard = (props = {}) => {
  const onToggle = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunCard
        run={run}
        isLatest={false}
        expanded={false}
        versionNames={{ 7: 'base' }}
        schedule={{ id: 9 }}
        entityType="agent"
        applicationId={3}
        onToggle={onToggle}
        {...props}
      />
    </ThemeProvider>,
  );
  return onToggle;
};

describe('ScheduleRunCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the trigger as Scheduled for a cron run, the status and the facts line', () => {
    renderCard();

    expect(screen.getByTestId('schedule-run-trigger')).toHaveTextContent('Scheduled');
    expect(screen.getByTestId('schedule-run-status')).toHaveTextContent('Success');
    expect(screen.getByTestId('schedule-run-facts')).toHaveTextContent('base');
    expect(screen.getByTestId('schedule-run-facts')).toHaveTextContent('1,500 tokens');
  });

  it('shows the Latest chip only on the latest run', () => {
    renderCard();
    expect(screen.queryByTestId('schedule-run-latest')).not.toBeInTheDocument();
    cleanup();

    renderCard({ isLatest: true });
    expect(screen.getByTestId('schedule-run-latest')).toBeInTheDocument();
  });

  it('shows the detail only while it is open and toggles on a click', () => {
    const onToggle = renderCard();
    expect(screen.queryByTestId('detail-stub')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith(4);
    cleanup();

    renderCard({ expanded: true });
    expect(screen.getByTestId('detail-stub')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the label of a Test run', () => {
    renderCard({ run: { ...run, trigger: 'test' } });

    expect(screen.getByTestId('schedule-run-trigger')).toHaveTextContent('Test');
  });
});
