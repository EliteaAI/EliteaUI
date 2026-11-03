// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import TestEntityButton from '../TestEntityButton';

const theme = createTheme({ palette: darkPalette });

const renderButton = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <TestEntityButton
        label="Test Pipeline"
        testId="pipeline-test-button"
        {...props}
      />
    </ThemeProvider>,
  );

describe('TestEntityButton', () => {
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

  it('renders the given label', () => {
    renderButton({ label: 'Test Agent', testId: 'agent-test-button' });

    expect(screen.getByTestId('agent-test-button')).toHaveTextContent('Test Agent');
  });
});
