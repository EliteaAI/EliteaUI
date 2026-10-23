// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import TestPipelineButton from '../TestPipelineButton';

const theme = createTheme({ palette: darkPalette });

const renderButton = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <TestPipelineButton {...props} />
    </ThemeProvider>,
  );

describe('TestPipelineButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('is disabled and does nothing when a disabled reason is given', () => {
    const onClick = vi.fn();
    renderButton({ onClick, disabledReason: 'Add and configure at least one node connected to End.' });

    const button = screen.getByTestId('pipeline-test-button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick when there is no disabled reason', () => {
    const onClick = vi.fn();
    renderButton({ onClick });

    const button = screen.getByTestId('pipeline-test-button');
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
