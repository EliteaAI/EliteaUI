// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleEnabledSwitch from '../ScheduleEnabledSwitch';

// #7254: a schedule paused by the system after refused runs says why on its switch

vi.mock('../../lib/hooks/useScheduleRowActions.hooks', () => ({
  useScheduleRowActions: () => ({ onPause: vi.fn(), onResume: vi.fn(), isBusy: false }),
}));

const theme = createTheme(getDesignTokens('light'));
const renderSwitch = row =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleEnabledSwitch
        testId="switch"
        row={{ id: 3, name: 'Nightly', allowed_actions: ['resume'], ...row }}
      />
    </ThemeProvider>,
  );
const PAUSED = 'Paused: runs were refused by credential governance';

describe('ScheduleEnabledSwitch', () => {
  afterEach(cleanup);

  it('says that governance refusals paused the schedule', async () => {
    renderSwitch({ enabled: false, disabled_reason: 'governance_refused' });
    expect(screen.getByRole('switch', { name: 'Enable Nightly' })).not.toBeChecked();
    fireEvent.mouseOver(screen.getByRole('switch').closest('span[aria-label]') ?? screen.getByRole('switch'));
    expect(await screen.findByText(PAUSED)).toBeInTheDocument();
  });

  it.each([
    ['a paused schedule with another reason', { enabled: false, disabled_reason: 'owner_lost_access' }],
    ['a schedule paused by hand', { enabled: false, disabled_reason: null }],
    [
      'a running schedule',
      { enabled: true, disabled_reason: 'governance_refused', allowed_actions: ['pause'] },
    ],
  ])('adds nothing for %s', (_label, row) => {
    renderSwitch(row);
    expect(screen.queryByLabelText(PAUSED)).not.toBeInTheDocument();
    expect(screen.queryByText(PAUSED)).not.toBeInTheDocument();
  });
});
