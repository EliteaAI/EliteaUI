// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import ConfigPanels from '../ConfigPanels';

const theme = createTheme({ palette: darkPalette });

const renderPanels = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ConfigPanels
        testId="panels"
        left={<div data-testid="general" />}
        right={<div data-testid="tools" />}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ConfigPanels', () => {
  afterEach(() => cleanup());

  it('puts the left and right sections in their own columns', () => {
    renderPanels();

    expect(within(screen.getByTestId('panels-left')).getByTestId('general')).toBeInTheDocument();
    expect(within(screen.getByTestId('panels-right')).getByTestId('tools')).toBeInTheDocument();
    expect(screen.getByTestId('panels')).toHaveAttribute('data-stacked', 'false');
  });

  it('stacks the right column under the left one', () => {
    renderPanels({ isStacked: true });

    expect(screen.getByTestId('panels')).toHaveAttribute('data-stacked', 'true');
    expect(screen.getByTestId('panels').firstChild).toBe(screen.getByTestId('panels-left'));
  });
});
