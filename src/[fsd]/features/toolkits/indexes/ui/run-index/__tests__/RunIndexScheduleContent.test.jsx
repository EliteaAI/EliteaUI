// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunIndexScheduleContent from '../RunIndexScheduleContent';

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BUTTON_VARIANTS: { iconLabel: 'iconLabel', tertiary: 'tertiary' },
    // eslint-disable-next-line no-unused-vars
    BaseBtn: ({ children, startIcon, variant, ...rest }) => <button {...rest}>{children}</button>,
  },
  Switch: {
    BaseSwitch: ({ checked, ...rest }) => (
      <input
        type="checkbox"
        checked={Boolean(checked)}
        {...rest}
      />
    ),
  },
}));

afterEach(() => cleanup());

// Build the real theme rather than a hand-listed subset of tokens. The expired branch renders
// RunIndexBanner, which reads palette.components.runIndexBanner, and a stub palette silently goes
// stale every time a component down here reaches for a token nobody remembered to add.
const theme = createTheme(getDesignTokens('dark'));

const renderSchedule = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <RunIndexScheduleContent
        scheduleSummary="At 03:00 every day"
        enabled
        onAddSchedule={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggle={() => {}}
        {...props}
      />
    </ThemeProvider>,
  );

const expiresLine = () => screen.queryByTestId('schedule-expires-at');

describe('RunIndexScheduleContent expiration', () => {
  it('says nothing about expiry until the scheduler has priced the schedule', () => {
    // A schedule created before this feature has no deadline yet. An empty "Expires:" label,
    // or a "never expires" claim, would both be wrong — it expires on the next tick's pricing.
    renderSchedule();

    expect(expiresLine()).not.toBeInTheDocument();
  });

  it('shows the deadline of a running schedule as upcoming', () => {
    renderSchedule({ expiresAt: '01/12/2026, 03:00', expired: false });

    expect(expiresLine()).toHaveTextContent('Expires:');
    expect(expiresLine()).toHaveTextContent('01/12/2026, 03:00');
  });

  it('reads the deadline in the past tense once the schedule has been retired', () => {
    renderSchedule({ expiresAt: '01/05/2026, 03:00', expired: true, enabled: false });

    expect(expiresLine()).toHaveTextContent('Expired:');
    expect(expiresLine()).not.toHaveTextContent('Expires:');
  });

  it('tells the owner how to revive a retired schedule', () => {
    // Expiry disables rather than deletes precisely so this is one toggle away. A banner that
    // only reports the retirement leaves the owner assuming the schedule is gone.
    renderSchedule({ expiresAt: '01/05/2026, 03:00', expired: true, enabled: false });

    expect(screen.getByText(/expired and was turned off/i)).toBeInTheDocument();
    expect(screen.getByText(/turn it back on/i)).toBeInTheDocument();
  });

  it('distinguishes a hand-disabled schedule from a retired one', () => {
    // Both are `enabled: false`. Showing the expiry banner for a schedule its owner switched
    // off would tell them the platform did something it did not do.
    renderSchedule({ enabled: false, expiresAt: '01/12/2026, 03:00', expired: false });

    expect(screen.getByText(/schedule is turned off/i)).toBeInTheDocument();
    expect(screen.queryByText(/expired and was turned off/i)).not.toBeInTheDocument();
  });

  it('keeps the toggle available on a retired schedule', () => {
    // The toggle is the renewal, so disabling it would make expiry a dead end.
    renderSchedule({ expiresAt: '01/05/2026, 03:00', expired: true, enabled: false });

    expect(screen.getByRole('checkbox')).not.toBeDisabled();
  });
});
