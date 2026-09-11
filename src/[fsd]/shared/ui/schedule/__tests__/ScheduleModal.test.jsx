// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleModal from '../ScheduleModal';

// Stand-ins for the heavy modal chrome, so the assertions are about the timezone handling only.
vi.mock('@/[fsd]/shared/ui', () => ({
  Modal: { BaseModal: props => <div>{props.content}</div> },
  Button: { BaseBtn: props => <button type="button">{props.children}</button> },
  Tab: { TabGroupButton: () => null },
}));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_COLORS: {}, BUTTON_VARIANTS: {} }));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({ default: () => null }));
vi.mock('@/assets/error-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/assets/info.svg?react', () => ({ default: () => null }));
vi.mock('@/components/FormInput', () => ({
  default: props => (
    <input
      data-testid={props['data-testid']}
      value={props.value}
      onChange={props.onChange}
    />
  ),
}));
vi.mock('../CronBuilder', () => ({
  default: props => <div data-testid="cron-builder-value">{props.value}</div>,
}));

// Fixed-offset zones keep the expected conversion stable across DST and across CI machines.
const BROWSER_TIMEZONE = 'UTC';
const FOREIGN_TIMEZONE = 'Etc/GMT-3'; // three hours ahead of UTC

// Only the viewer's timezone is pinned; the conversion itself runs for real.
vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getBrowserTimezone: () => BROWSER_TIMEZONE,
}));

const theme = createTheme({
  palette: {
    background: { surface: { interactive: { default: '#111' } }, tips: { main: '#112' }, errorBkg: '#311' },
    border: { tips: '#123', error: '#411' },
    text: { tips: '#abc', warningText: '#f00', error: '#f00' },
    icon: { fill: { tips: '#abc' } },
    secondary: { main: '#888' },
  },
});

afterEach(() => cleanup());

const renderModal = props =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ScheduleModal timezone handling', () => {
  it('shows the cron unchanged and no notice when the schedule is in the viewer timezone', () => {
    renderModal({ cron: '51 12 * * *', timezone: BROWSER_TIMEZONE });

    expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('51 12 * * *');
    expect(screen.queryByTestId('schedule-timezone-notice')).not.toBeInTheDocument();
  });

  it('shows no notice when the schedule has no stored timezone', () => {
    renderModal({ cron: '51 12 * * *' });

    expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('51 12 * * *');
    expect(screen.queryByTestId('schedule-timezone-notice')).not.toBeInTheDocument();
  });

  it('converts the cron and explains the conversion for a foreign timezone', () => {
    renderModal({ cron: '51 12 * * *', timezone: FOREIGN_TIMEZONE });

    // The schedule was configured three hours ahead, so 12:51 there is 09:51 for this viewer.
    expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('51 9 * * *');

    const notice = screen.getByTestId('schedule-timezone-notice');
    expect(notice).toHaveTextContent(FOREIGN_TIMEZONE);
    expect(notice).toHaveTextContent(BROWSER_TIMEZONE);
    expect(notice).toHaveTextContent('converted to your timezone');
  });

  it('warns instead of converting when the expression cannot be shifted', () => {
    renderModal({ cron: '*/30 * * * *', timezone: FOREIGN_TIMEZONE });

    expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('*/30 * * * *');
    expect(screen.getByTestId('schedule-timezone-notice')).toHaveTextContent(
      'cannot be converted automatically',
    );
  });
});
