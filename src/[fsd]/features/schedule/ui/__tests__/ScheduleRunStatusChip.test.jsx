// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleRunStatusChip from '../ScheduleRunStatusChip';

// table width: the Schedules table shows the last run as a chip, a word or an icon

const renderChip = props =>
  render(
    <ThemeProvider theme={createTheme({ palette: lightPalette })}>
      <ScheduleRunStatusChip {...props} />
    </ThemeProvider>,
  );

afterEach(() => cleanup());

describe('ScheduleRunStatusChip', () => {
  it('keeps the outlined chip with the icon and the word by default', () => {
    renderChip({ status: 'failed' });
    const chip = screen.getByTestId('schedule-run-status');
    expect(chip).toHaveClass('MuiChip-outlined');
    expect(chip).toHaveTextContent('Failed');
    expect(chip.querySelector('.MuiChip-icon')).not.toBeNull();
  });

  it('shows the icon and the word with no border for the text variant', () => {
    renderChip({ status: 'success', variant: 'text' });
    const chip = screen.getByTestId('schedule-run-status');
    expect(chip).toHaveTextContent('Success');
    expect(getComputedStyle(chip).borderStyle).toBe('none');
  });

  it('shows only the icon, named by the status word, for the icon variant', () => {
    renderChip({ status: 'waiting_for_approval', variant: 'icon' });
    const icon = screen.getByRole('img', { name: 'Waiting for approval' });
    expect(icon).toHaveAttribute('data-testid', 'schedule-run-status');
    expect(icon).not.toHaveTextContent('Waiting for approval');
    expect(icon.querySelector('svg')).not.toBeNull();
  });
});
