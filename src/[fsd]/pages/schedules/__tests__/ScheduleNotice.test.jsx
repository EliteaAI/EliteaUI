// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { MemoryRouter } from 'react-router-dom';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleNotice from '../ScheduleNotice';

const theme = createTheme(getDesignTokens('light'));

describe('ScheduleNotice', () => {
  afterEach(cleanup);

  const renderNotice = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <ScheduleNotice message="Schedule not found." />
        </MemoryRouter>
      </ThemeProvider>,
    );

  it('shows the message with a link to the Schedules list', () => {
    renderNotice();
    expect(screen.getByText(/Schedule not found/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Schedules' })).toHaveAttribute('href', '/settings/schedules');
  });

  it('sizes the notice in rem, not px', () => {
    renderNotice();
    expect(screen.getByText(/Schedule not found/)).toHaveStyle({ marginTop: '3.125rem' });
  });
});
