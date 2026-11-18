// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ReconfirmBadge from '../ReconfirmBadge';

describe('ReconfirmBadge', () => {
  afterEach(cleanup);

  it('shows the badge and opens the risk review from its link', () => {
    const onReview = vi.fn();
    render(
      <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
        <ReconfirmBadge onReview={onReview} />
      </ThemeProvider>,
    );
    expect(screen.getByText('Needs re-confirm')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('schedule-reconfirm-review'));
    expect(onReview).toHaveBeenCalledTimes(1);
  });
});
