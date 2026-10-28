// @vitest-environment jsdom
import { useState } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleSettingsSection from '../ScheduleSettingsSection';
import { BROWSER_TIMEZONE, FOREIGN_TIMEZONE, theme } from './scheduleTestSetup';

// Stand-ins for the heavy UI parts, so the assertions are about the section behaviour only.
vi.mock('@/[fsd]/shared/ui', async () => ({
  Tab: { TabGroupButton: (await import('./scheduleTestSetup')).TabGroupButton },
}));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', async () => ({
  default: (await import('./scheduleTestSetup')).Empty,
}));
vi.mock('@/assets/error-icon.svg?react', () => ({ default: () => <i data-testid="error-icon" /> }));
vi.mock('@/assets/info.svg?react', async () => ({ default: (await import('./scheduleTestSetup')).Empty }));
vi.mock('@/components/FormInput', async () => ({ default: (await import('./scheduleTestSetup')).FormInput }));
vi.mock('../CronBuilder', () => ({
  default: props => (
    <div>
      <span data-testid="cron-builder-value">{props.value}</span>
      <button
        type="button"
        onClick={() => props.onChange('0 0 * * 6')}
      >
        pick Saturday midnight
      </button>
    </div>
  ),
}));

vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal =>
  (await import('./scheduleTestSetup')).mockScheduleHelpers(importOriginal),
);

const HINT = 'minute – hour – day (month) – month – day (week)';

afterEach(() => cleanup());

// The section is controlled; the harness holds the cron like the form does.
// The stored cron is the initial one, so the tests hold for a section that reads it from `sourceCron`
// or from `value` at mount.
const Harness = ({ initial = '0 0 * * 6', onChange = () => {}, ...rest }) => {
  const [value, setValue] = useState(initial);
  return (
    <ScheduleSettingsSection
      value={value}
      sourceCron={initial}
      onChange={next => {
        setValue(next);
        onChange(next);
      }}
      {...rest}
    />
  );
};

const renderSection = props =>
  render(
    <ThemeProvider theme={theme}>
      <Harness {...props} />
    </ThemeProvider>,
  );

const openCronTab = () => fireEvent.click(screen.getByText('Cron expression'));

describe('ScheduleSettingsSection', () => {
  describe('one cron value for both tabs', () => {
    it('passes the Builder cron to the caller and shows it on the Cron expression tab (TC-US30-01)', () => {
      const onChange = vi.fn();
      renderSection({ initial: '15 3 * * 1', onChange });

      fireEvent.click(screen.getByText('pick Saturday midnight'));
      expect(onChange).toHaveBeenCalledWith('0 0 * * 6');

      openCronTab();
      expect(screen.getByTestId('pipeline-schedule-cron-input')).toHaveValue('0 0 * * 6');
    });

    it('shows a cron typed on the cron tab in the Builder (TC-US30-02)', () => {
      renderSection({ initial: '0 0 * * 6' });

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), {
        target: { value: '30 8 * * 1' },
      });
      fireEvent.click(screen.getByText('Builder'));

      expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('30 8 * * 1');
    });
  });

  describe('cron tab field and hint', () => {
    it('shows a text field and the hint on the Cron expression tab (TC-US30-05)', () => {
      renderSection();

      openCronTab();

      expect(screen.getByTestId('pipeline-schedule-cron-input')).toBeInTheDocument();
      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('shows no cron field or hint on the Builder tab (TC-US30-06)', () => {
      renderSection();

      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
      expect(screen.queryByTestId('pipeline-schedule-cron-input')).not.toBeInTheDocument();
    });

    it('builds the test ids from testIdPrefix', () => {
      renderSection({ testIdPrefix: 'schedule-settings' });

      openCronTab();

      expect(screen.getByTestId('schedule-settings-cron-input')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-settings-mode-tabs')).toBeInTheDocument();
    });
  });

  describe('info block', () => {
    it('shows the rule, the timezone name and the next run under each tab (TC-US30-07)', () => {
      renderSection({ initial: '0 0 * * 6' });

      const expectInfo = () => {
        const info = screen.getByTestId('pipeline-schedule-info');
        expect(info).toHaveTextContent('At 00:00, only on Saturday');
        expect(info).toHaveTextContent('Next run:');
        expect(info).toHaveTextContent(BROWSER_TIMEZONE);
        expect(screen.getByTestId('pipeline-schedule-next-run')).toBeInTheDocument();
      };

      expectInfo();
      openCronTab();
      expectInfo();
    });

    it('shows the timezone notice when the schedule timezone differs (TC-US30-08)', () => {
      renderSection({ initial: '0 0 * * 6', sourceTimezone: FOREIGN_TIMEZONE });

      const notice = screen.getByTestId('schedule-timezone-notice');
      expect(notice).toHaveTextContent(FOREIGN_TIMEZONE);
      expect(notice).toHaveTextContent(BROWSER_TIMEZONE);
      expect(screen.getByTestId('pipeline-schedule-info')).toHaveTextContent(BROWSER_TIMEZONE);
    });

    it('says the cron cannot be converted when its time is not fixed', () => {
      renderSection({ initial: '*/5 * * * *', sourceTimezone: FOREIGN_TIMEZONE });

      expect(screen.getByTestId('schedule-timezone-notice')).toHaveTextContent(
        'cannot be converted automatically',
      );
    });

    it('keeps the notice text when the cron changes after mount', () => {
      renderSection({ initial: '0 0 * * 6', sourceTimezone: FOREIGN_TIMEZONE });
      const before = screen.getByTestId('schedule-timezone-notice').textContent;

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), {
        target: { value: '*/5 * * * *' },
      });

      expect(before).not.toContain('cannot be converted automatically');
      expect(screen.getByTestId('schedule-timezone-notice').textContent).toBe(before);
    });

    it('shows no notice when the timezones match', () => {
      renderSection({ sourceTimezone: BROWSER_TIMEZONE });

      expect(screen.queryByTestId('schedule-timezone-notice')).not.toBeInTheDocument();
    });
  });

  describe('errors', () => {
    it('shows no next run for an invalid cron (TC-US30-09)', () => {
      renderSection();

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), {
        target: { value: '61 * * * *' },
      });

      expect(screen.queryByTestId('pipeline-schedule-next-run')).not.toBeInTheDocument();
    });

    it('shows the validation message with an error icon under the cron field (TC-US30-10)', () => {
      renderSection();

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: '* * *' } });

      const error = screen.getByTestId('pipeline-schedule-cron-error');
      expect(error).toHaveTextContent('Cron must have exactly 5 parts with space between every part');
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('places the error row under the cron field, before the info block and the notice', () => {
      renderSection({ sourceTimezone: FOREIGN_TIMEZONE });

      openCronTab();
      const input = screen.getByTestId('pipeline-schedule-cron-input');
      fireEvent.change(input, { target: { value: '* * *' } });

      const error = screen.getByTestId('pipeline-schedule-cron-error');
      const follows = (first, second) =>
        Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(follows(input, error)).toBe(true);
      expect(follows(error, screen.getByTestId('pipeline-schedule-info'))).toBe(true);
      expect(follows(error, screen.getByTestId('schedule-timezone-notice'))).toBe(true);
    });

    it('shows the required message and no next run for an empty cron (TC-US30-12)', () => {
      renderSection();

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: '' } });

      expect(screen.getByTestId('pipeline-schedule-cron-error')).toHaveTextContent(
        'Cron expression is required',
      );
      expect(screen.queryByTestId('pipeline-schedule-next-run')).not.toBeInTheDocument();
    });

    it('shows the server error under the cron field (TC-US30-11)', () => {
      renderSection({ initial: '*/1 * * * *', error: 'Runs must be at least 5 minutes apart' });

      expect(screen.getByTestId('pipeline-schedule-cron-error')).toHaveTextContent(
        'Runs must be at least 5 minutes apart',
      );
    });
  });
});

describe('ScheduleSettingsSection opening tab', () => {
  it('opens a saved cron the Builder cannot show on the Cron expression tab, with its error', () => {
    renderSection({ initial: '0 * * * *' });

    expect(screen.getByTestId('pipeline-schedule-cron-input')).toHaveValue('0 * * * *');
    expect(screen.queryByTestId('cron-builder-value')).not.toBeInTheDocument();
    expect(screen.getByTestId('pipeline-schedule-cron-error')).toHaveTextContent(
      'Frequency cannot be more than once per day',
    );
  });

  it('opens a saved cron the Builder can show on the Builder tab, even in another notation', () => {
    renderSection({ initial: '30 9 * * 1,2,3' });

    expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('30 9 * * 1,2,3');
    expect(screen.queryByTestId('pipeline-schedule-cron-input')).not.toBeInTheDocument();
  });

  it('opens an empty cron on the Builder tab', () => {
    renderSection({ initial: '' });

    expect(screen.getByTestId('cron-builder-value')).toBeInTheDocument();
  });

  it('keeps the tab the user picked when the cron changes later', () => {
    renderSection({ initial: '0 0 * * 6' });

    openCronTab();
    fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: '15 3 * * 1' } });

    expect(screen.getByTestId('pipeline-schedule-cron-input')).toHaveValue('15 3 * * 1');
  });
});
