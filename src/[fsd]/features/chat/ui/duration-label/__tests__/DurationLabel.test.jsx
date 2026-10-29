// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import DurationLabel from '../DurationLabel';

const theme = createTheme(getDesignTokens('dark'));

const renderLabel = props =>
  render(
    <ThemeProvider theme={theme}>
      <DurationLabel
        testId="duration"
        {...props}
      />
    </ThemeProvider>,
  );

describe('DurationLabel', () => {
  afterEach(() => cleanup());

  it('renders the compact duration', () => {
    renderLabel({ durationMs: 2400 });
    expect(screen.getByTestId('duration')).toHaveTextContent('· 2.4s');
  });

  it('renders nothing when the duration is unknown', () => {
    renderLabel({ durationMs: null });
    expect(screen.queryByTestId('duration')).toBeNull();
  });

  it('shows the precise time and approval-wait note on hover', async () => {
    renderLabel({ durationMs: 2350, includesApprovalWait: true });
    fireEvent.mouseOver(screen.getByTestId('duration'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Took 2.350s (includes time waiting for approval)',
    );
  });
});
