// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleModal from '../ScheduleModal';
import { BROWSER_TIMEZONE, FOREIGN_TIMEZONE, theme } from './scheduleTestSetup';

// Stand-ins for the heavy modal chrome, so the assertions are about the timezone handling only.
vi.mock('@/[fsd]/shared/ui', async () => ({
  Modal: {
    BaseModal: props => (
      <div data-testid={props['data-testid']}>
        {props.content}
        {props.actions}
      </div>
    ),
  },
  Button: {
    BaseBtn: props => (
      <button
        type="button"
        data-testid={props['data-testid']}
        disabled={props.disabled}
        onClick={props.onClick}
      >
        {props.children}
      </button>
    ),
  },
  Tab: { TabGroupButton: (await import('./scheduleTestSetup')).TabGroupButton },
}));
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_COLORS: {}, BUTTON_VARIANTS: {} }));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', async () => ({
  default: (await import('./scheduleTestSetup')).Empty,
}));
vi.mock('@/assets/error-icon.svg?react', async () => ({
  default: (await import('./scheduleTestSetup')).Empty,
}));
vi.mock('@/assets/info.svg?react', async () => ({ default: (await import('./scheduleTestSetup')).Empty }));
vi.mock('@/components/FormInput', async () => ({ default: (await import('./scheduleTestSetup')).FormInput }));
vi.mock('../CronBuilder', () => ({
  default: props => <div data-testid="cron-builder-value">{props.value}</div>,
}));

vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal =>
  (await import('./scheduleTestSetup')).mockScheduleHelpers(importOriginal),
);

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

describe('ScheduleModal popup contract (R1.4, EL-7011)', () => {
  it('keeps the popup, tab, summary and button test ids', () => {
    renderModal({ cron: '51 12 * * *' });

    [
      'pipeline-schedule-settings-modal',
      'pipeline-schedule-mode-tabs',
      'pipeline-schedule-summary-text',
    ].forEach(id => expect(screen.getByTestId(id)).toBeInTheDocument());
    expect(screen.getByTestId('pipeline-schedule-modal-cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-schedule-modal-save-button')).toBeInTheDocument();
  });

  it('shows the Builder tab first and the cron field on the Cron expression tab', () => {
    renderModal({ cron: '51 12 * * *' });

    expect(screen.getByText('Builder')).toBeInTheDocument();
    expect(screen.queryByTestId('pipeline-schedule-cron-input')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Cron expression'));

    expect(screen.getByTestId('pipeline-schedule-cron-input')).toHaveValue('51 12 * * *');
  });

  it('saves the edited cron and closes the popup', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    renderModal({ cron: '51 12 * * *', onSubmit, onClose });

    fireEvent.click(screen.getByText('Cron expression'));
    fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: '0 6 * * *' } });
    fireEvent.click(screen.getByTestId('pipeline-schedule-modal-save-button'));

    expect(onSubmit).toHaveBeenCalledWith('0 6 * * *');
    expect(onClose).toHaveBeenCalled();
  });

  it('disables Save for an invalid cron', () => {
    renderModal({ cron: '51 12 * * *' });

    fireEvent.click(screen.getByText('Cron expression'));
    fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: 'nope' } });

    expect(screen.getByTestId('pipeline-schedule-modal-save-button')).toBeDisabled();
  });
});
