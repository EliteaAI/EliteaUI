// @vitest-environment jsdom
import { createRef } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunsSection from '../ScheduleRunsSection';

// EL-7011 owner CR 2026-10-21 test panel log: the Runs table as the last section of the left column

const run = {
  id: 1,
  trigger: 'cron',
  status: 'success',
  conversation_id: 70,
  started_at: '2026-10-21T09:00:00Z',
};
const theme = createTheme(getDesignTokens('light'));
const renderSection = props => {
  const handlers = { onOpen: vi.fn(), onExpandedChange: vi.fn() };
  const ref = createRef();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunsSection
        ref={ref}
        runs={[run]}
        versionNames={{}}
        expanded
        {...handlers}
        {...props}
      />
    </ThemeProvider>,
  );
  return { ...handlers, ref };
};

describe('ScheduleRunsSection EL-7011 owner CR 2026-10-21', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('holds the Runs table under the RUNS OF THIS SCHEDULE title, and Open reaches the panel', () => {
    const { onOpen } = renderSection({ selectedRunId: 1 });

    expect(screen.getByTestId('schedule-section-runs')).toHaveTextContent('RUNS OF THIS SCHEDULE');
    expect(screen.getByTestId('schedule-run-row')).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpen).toHaveBeenCalledWith(run);
  });

  it('gives its element to the ref, so Run History can scroll to it', () => {
    const { ref } = renderSection();
    expect(ref.current).toContainElement(screen.getByTestId('schedule-section-runs'));
  });

  it('is open or closed as the page says, and reports a title click', () => {
    const { onExpandedChange } = renderSection({ expanded: false });

    expect(screen.getByRole('button', { name: /RUNS OF THIS SCHEDULE/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    fireEvent.click(screen.getByTestId('schedule-section-runs'));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });
});
