// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CountBadge from '../CountBadge';

const theme = createTheme({ palette: { border: { cardsOutlines: '#262B34' } } });

const renderBadge = props =>
  render(
    <ThemeProvider theme={theme}>
      <CountBadge
        testId="badge"
        {...props}
      />
    </ThemeProvider>,
  );

describe('CountBadge', () => {
  afterEach(() => cleanup());

  it('renders a bare count when no total is given', () => {
    renderBadge({ count: 0 });

    expect(screen.getByTestId('badge')).toHaveTextContent('0');
  });

  it('renders count over total', () => {
    renderBadge({ count: 16, total: 33 });

    expect(screen.getByTestId('badge')).toHaveTextContent('16 / 33');
  });

  it('renders a zero total instead of treating it as absent', () => {
    renderBadge({ count: 0, total: 0 });

    expect(screen.getByTestId('badge')).toHaveTextContent('0 / 0');
  });

  it('exposes the accessible label', () => {
    renderBadge({ count: 2, ariaLabel: '2 indexes' });

    expect(screen.getByLabelText('2 indexes')).toBeInTheDocument();
  });
});
