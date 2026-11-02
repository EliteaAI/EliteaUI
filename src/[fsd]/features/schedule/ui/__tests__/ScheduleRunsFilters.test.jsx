// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleRunsFilters from '../ScheduleRunsFilters';

// the Type and Status filters of the Runs card

const theme = createTheme(getDesignTokens('light'));
const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Success', value: 'success' },
];

const renderFilters = (filters = { trigger: '', status: '' }) => {
  const onChange = vi.fn();
  const onClear = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunsFilters
        filters={filters}
        statusOptions={statusOptions}
        onChange={onChange}
        onClear={onClear}
      />
    </ThemeProvider>,
  );
  return { onChange, onClear };
};

describe('ScheduleRunsFilters', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows the Type and Status filters and no Clear button without a filter', () => {
    renderFilters();

    expect(screen.getByTestId('schedule-runs-filters')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-runs-filters-clear')).not.toBeInTheDocument();
  });

  it('shows Clear filters while a filter is set and calls onClear', () => {
    const { onClear } = renderFilters({ trigger: 'test', status: '' });

    fireEvent.click(screen.getByTestId('schedule-runs-filters-clear'));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
