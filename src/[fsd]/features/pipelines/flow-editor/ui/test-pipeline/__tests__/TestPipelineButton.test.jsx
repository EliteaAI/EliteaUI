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

  it('is disabled and does nothing while the pipeline has no nodes', () => {
    const onClick = vi.fn();
    renderButton({ onClick, hasNodes: false });

    const button = screen.getByTestId('pipeline-test-button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when a disabled reason is given', () => {
    renderButton({ onClick: vi.fn(), hasNodes: true, disabledReason: 'Save the pipeline to test it' });

    expect(screen.getByTestId('pipeline-test-button')).toBeDisabled();
  });

  it('calls onClick when the pipeline has nodes', () => {
    const onClick = vi.fn();
    renderButton({ onClick, hasNodes: true });

    const button = screen.getByTestId('pipeline-test-button');
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
