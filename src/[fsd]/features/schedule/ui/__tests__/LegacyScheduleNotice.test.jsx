// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import LegacyScheduleNotice from '../LegacyScheduleNotice';

const renderNotice = props =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <LegacyScheduleNotice {...props} />
    </ThemeProvider>,
  );

describe('LegacyScheduleNotice', () => {
  afterEach(cleanup);

  it('says the old pipeline schedule is read-only and names the cron', () => {
    renderNotice({ cron: '0 0 * * 6', onOpenSchedules: vi.fn() });

    expect(screen.getByText(/no longer editable here/i)).toBeInTheDocument();
    expect(screen.getByText(/0 0 \* \* 6/)).toBeInTheDocument();
  });

  it('calls onOpenSchedules from the Schedules section link', () => {
    const onOpenSchedules = vi.fn();
    renderNotice({ onOpenSchedules });

    fireEvent.click(screen.getByRole('button', { name: 'Schedules section' }));

    expect(onOpenSchedules).toHaveBeenCalledTimes(1);
  });
});
