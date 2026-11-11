// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleReenableBanner from '../ScheduleReenableBanner';

// The Re-enable banner of a trigger switched off for its connections (#7401)

vi.mock('../ScheduleReenableAction', () => ({
  default: () => <span data-testid="schedule-reenable-button" />,
}));

const SWITCHED_OFF = { id: 3, enabled: false, allowed_actions: ['edit', 'resume'] };
const setup = schedule =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <ScheduleReenableBanner schedule={schedule} />
    </ThemeProvider>,
  );

describe('ScheduleReenableBanner', () => {
  afterEach(cleanup);

  it.each([
    ['credential_expired', /saved login stopped working/],
    ['connections_changed', /needs a person to sign in/],
    ['owner_changed', /owner changed/],
  ])('names the reason %s and offers Re-enable', (reason, text) => {
    setup({ ...SWITCHED_OFF, disabled_reason: reason });

    expect(screen.getByTestId('schedule-reenable-banner')).toHaveTextContent(text);
    expect(screen.getByTestId('schedule-reenable-button')).toBeInTheDocument();
  });

  it('shows nothing for a trigger that is on or was paused for another reason', () => {
    setup({ ...SWITCHED_OFF, enabled: true, disabled_reason: 'credential_expired' });
    expect(screen.queryByTestId('schedule-reenable-banner')).toBeNull();
    cleanup();

    setup({ ...SWITCHED_OFF, disabled_reason: 'prerun_refused' });
    expect(screen.queryByTestId('schedule-reenable-banner')).toBeNull();
  });

  it('hides Re-enable from a caller who may not resume', () => {
    setup({ ...SWITCHED_OFF, disabled_reason: 'credential_expired', allowed_actions: ['edit'] });

    expect(screen.getByTestId('schedule-reenable-banner')).toBeInTheDocument();
    expect(screen.queryByTestId('schedule-reenable-button')).toBeNull();
  });
});
