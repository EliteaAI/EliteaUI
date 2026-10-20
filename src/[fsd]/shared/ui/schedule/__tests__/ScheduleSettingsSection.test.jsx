// @vitest-environment jsdom
import { useState } from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ScheduleSettingsSection from '../ScheduleSettingsSection';

// Stand-ins for the heavy UI parts, so the assertions are about the section behaviour only.
vi.mock('@/[fsd]/shared/ui', () => ({
  Tab: {
    TabGroupButton: props => (
      <div data-testid={props['data-testid']}>
        {props.arrayBtn.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={event => props.onChange(event, item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    ),
  },
}));
vi.mock('@/[fsd]/shared/ui/tooltip/InfoTooltip', () => ({ default: () => null }));
vi.mock('@/assets/error-icon.svg?react', () => ({ default: () => <i data-testid="error-icon" /> }));
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

const BROWSER_TIMEZONE = 'UTC';
const FOREIGN_TIMEZONE = 'Etc/GMT-3';

vi.mock('@/[fsd]/shared/lib/helpers/schedule.helpers', async importOriginal => ({
  ...(await importOriginal()),
  getBrowserTimezone: () => BROWSER_TIMEZONE,
}));

const theme = createTheme({
  palette: {
    background: { surface: { interactive: { default: '#111' } }, error: '#311' },
    border: { tips: '#123', error: '#411' },
    text: { tips: '#abc', warningText: '#f00', error: '#f00' },
    icon: { fill: { tips: '#abc' } },
    secondary: { main: '#888' },
    alert: { info: { background: '#112', border: '#123', text: '#abc', icon: '#abc' } },
    components: { tips: { background: { main: '#112', secondary: '#113' } } },
  },
});

const HINT = 'minute – hour – day (month) – month – day (week)';

afterEach(() => cleanup());

// The section is controlled; the harness holds the cron like the form does.
const Harness = ({ initial = '0 0 * * 6', onChange = () => {}, ...rest }) => {
  const [value, setValue] = useState(initial);
  return (
    <ScheduleSettingsSection
      value={value}
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

describe('EL-7011 US-30 ScheduleSettingsSection', () => {
  describe('R1.1 and R1.2 one cron value for both tabs', () => {
    it('R1.1 passes the Builder cron to the caller and shows it on the Cron expression tab (TC-US30-01)', () => {
      const onChange = vi.fn();
      renderSection({ initial: '15 3 * * 1', onChange });

      fireEvent.click(screen.getByText('pick Saturday midnight'));
      expect(onChange).toHaveBeenCalledWith('0 0 * * 6');

      openCronTab();
      expect(screen.getByTestId('pipeline-schedule-cron-input')).toHaveValue('0 0 * * 6');
    });

    it('R1.2 shows a cron typed on the cron tab in the Builder (TC-US30-02)', () => {
      renderSection({ initial: '0 0 * * 6' });

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), {
        target: { value: '30 8 * * 1' },
      });
      fireEvent.click(screen.getByText('Builder'));

      expect(screen.getByTestId('cron-builder-value')).toHaveTextContent('30 8 * * 1');
    });
  });

  describe('R1.3 cron tab field and hint', () => {
    it('R1.3 shows a text field and the hint on the Cron expression tab (TC-US30-05)', () => {
      renderSection();

      openCronTab();

      expect(screen.getByTestId('pipeline-schedule-cron-input')).toBeInTheDocument();
      expect(screen.getByText(HINT)).toBeInTheDocument();
    });

    it('R1.3 shows no cron field or hint on the Builder tab (TC-US30-06)', () => {
      renderSection();

      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
      expect(screen.queryByTestId('pipeline-schedule-cron-input')).not.toBeInTheDocument();
    });

    it('R1.3 builds the test ids from testIdPrefix', () => {
      renderSection({ testIdPrefix: 'schedule-settings' });

      openCronTab();

      expect(screen.getByTestId('schedule-settings-cron-input')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-settings-mode-tabs')).toBeInTheDocument();
    });
  });

  describe('R2.1 and R2.2 info block', () => {
    it('R2.1 shows the rule, the timezone name and the next run under each tab (TC-US30-07)', () => {
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

    it('R2.2 shows the timezone notice when the schedule timezone differs (TC-US30-08)', () => {
      renderSection({ initial: '0 0 * * 6', sourceTimezone: FOREIGN_TIMEZONE });

      const notice = screen.getByTestId('schedule-timezone-notice');
      expect(notice).toHaveTextContent(FOREIGN_TIMEZONE);
      expect(notice).toHaveTextContent(BROWSER_TIMEZONE);
      expect(screen.getByTestId('pipeline-schedule-info')).toHaveTextContent(BROWSER_TIMEZONE);
    });

    it('R2.2 shows no notice when the timezones match', () => {
      renderSection({ sourceTimezone: BROWSER_TIMEZONE });

      expect(screen.queryByTestId('schedule-timezone-notice')).not.toBeInTheDocument();
    });
  });

  describe('R2.3 and R2.4 errors', () => {
    it('R2.3 shows no next run for an invalid cron (TC-US30-09)', () => {
      renderSection();

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), {
        target: { value: '61 * * * *' },
      });

      expect(screen.queryByTestId('pipeline-schedule-next-run')).not.toBeInTheDocument();
    });

    it('R2.3 shows the validation message with an error icon under the cron field (TC-US30-10)', () => {
      renderSection();

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: '* * *' } });

      const error = screen.getByTestId('pipeline-schedule-cron-error');
      expect(error).toHaveTextContent('Cron must have exactly 5 parts with space between every part');
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('R2.3 shows the required message and no next run for an empty cron (TC-US30-12)', () => {
      renderSection();

      openCronTab();
      fireEvent.change(screen.getByTestId('pipeline-schedule-cron-input'), { target: { value: '' } });

      expect(screen.getByTestId('pipeline-schedule-cron-error')).toHaveTextContent(
        'Cron expression is required',
      );
      expect(screen.queryByTestId('pipeline-schedule-next-run')).not.toBeInTheDocument();
    });

    it('R2.4 shows the server error under the cron field (TC-US30-11)', () => {
      renderSection({ initial: '*/1 * * * *', error: 'Runs must be at least 5 minutes apart' });

      expect(screen.getByTestId('pipeline-schedule-cron-error')).toHaveTextContent(
        'Runs must be at least 5 minutes apart',
      );
    });
  });
});
