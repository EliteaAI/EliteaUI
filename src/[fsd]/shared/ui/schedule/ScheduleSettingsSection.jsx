import { memo, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { Tab } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import ErrorIcon from '@/assets/error-icon.svg?react';
import InfoIcon from '@/assets/info.svg?react';
import FormInput from '@/components/FormInput';

import CronBuilder from './CronBuilder';

const { canConvertCronTimezone, getBrowserTimezone, getNextCronRun, validateCronExpression } =
  ScheduleHelpers;

const viewButtons = [
  { value: 'builder', label: 'Builder' },
  { value: 'cron', label: 'Cron expression' },
];

/**
 * Builder and Cron expression tabs with the rule, the next run and the errors.
 * Controlled: `value` is the cron in the browser timezone.
 * `sourceTimezone` is the timezone the schedule was stored in; `error` is a server error for the cron.
 */
const ScheduleSettingsSection = memo(props => {
  const { value, onChange, sourceTimezone, error, testIdPrefix = 'pipeline-schedule' } = props;

  const styles = scheduleSettingsSectionStyles();

  const [cronType, setCronType] = useState('builder');

  const browserTimezone = useMemo(() => getBrowserTimezone(), []);

  const cronState = useMemo(() => validateCronExpression(value), [value]);

  const timezoneNotice = useMemo(() => {
    if (!sourceTimezone || !browserTimezone || sourceTimezone === browserTimezone) return null;

    if (!canConvertCronTimezone(value, sourceTimezone, browserTimezone)) {
      return `This schedule was configured in ${sourceTimezone} and its expression cannot be converted automatically, so the times below are shown as configured. Saving will reinterpret them in your timezone (${browserTimezone}).`;
    }

    return `This schedule was configured in ${sourceTimezone}. The times below are converted to your timezone (${browserTimezone}) and will be saved in it.`;
  }, [value, sourceTimezone, browserTimezone]);

  const nextRun = useMemo(() => {
    if (!cronState.isValid) return null;
    const date = getNextCronRun(value);
    if (!date) return null;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [value, cronState.isValid]);

  const errorText = error || (cronState.isValid ? null : cronState.message);

  return (
    <Box sx={styles.contentWrapper}>
      <Box sx={styles.tabRow}>
        <Tab.TabGroupButton
          data-testid={`${testIdPrefix}-mode-tabs`}
          arrayBtn={viewButtons}
          value={cronType}
          onChange={(_, newValue) => setCronType(newValue)}
          disableTooltip
        />
      </Box>

      {cronType === 'builder' ? (
        <Box sx={styles.cronWrapper}>
          <CronBuilder
            value={value}
            onChange={onChange}
            invalidField={cronState.isValid ? null : cronState.field}
          />
        </Box>
      ) : (
        <Box sx={styles.cronWrapper}>
          <FormInput
            data-testid={`${testIdPrefix}-cron-input`}
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="* * * * *"
            error={Boolean(errorText)}
            sx={styles.cronInput}
          />
          <Box sx={styles.descriptionContainer}>
            <Typography
              variant="bodySmall"
              sx={styles.cronDescription}
            >
              minute – hour – day (month) – month – day (week)
            </Typography>
            <InfoTooltip
              infoTooltip="Cron expression help"
              href="https://crontab.guru/#*_*_*_*"
              sx={styles.infoIconWrapper}
            />
          </Box>
        </Box>
      )}

      <Box
        data-testid={`${testIdPrefix}-info`}
        sx={styles.previewBox}
      >
        <Typography
          data-testid={`${testIdPrefix}-summary-text`}
          variant="headingSmall"
          sx={styles.previewSummary}
        >
          {cronState.isValid ? `"${cronState.message}"` : '-'}
        </Typography>

        {nextRun && (
          <Box
            data-testid={`${testIdPrefix}-next-run`}
            sx={styles.nextRunContainer}
          >
            <Typography
              variant="bodySmall"
              color="text.primary"
            >
              Next run:
            </Typography>
            <Typography variant="labelSmall">{`${nextRun} (${browserTimezone})`}</Typography>
          </Box>
        )}
      </Box>

      {timezoneNotice && (
        <Box sx={styles.noticeContainer}>
          <Box
            component={InfoIcon}
            sx={styles.noticeIcon}
          />
          <Typography
            data-testid="schedule-timezone-notice"
            variant="labelSmall"
            sx={styles.noticeText}
          >
            {timezoneNotice}
          </Typography>
        </Box>
      )}

      {errorText && (
        <Box
          data-testid={`${testIdPrefix}-cron-error`}
          sx={styles.errorContainer}
        >
          <ErrorIcon />
          <Typography
            variant="labelSmall"
            sx={styles.previewSummaryError}
          >
            {errorText}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

ScheduleSettingsSection.displayName = 'ScheduleSettingsSection';

/** @type {MuiSx} */
const scheduleSettingsSectionStyles = () => ({
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '0',
    width: '100%',
  },
  tabRow: {
    display: 'flex',
    justifyContent: 'center',
  },
  previewBox: {
    padding: '1rem',
    borderRadius: '0.5rem',
    background: ({ palette }) => palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.625rem',
    width: '100%',
  },
  cronInput: {
    padding: '0',
    width: '100%',
    '& input': {
      textAlign: 'center',
    },
  },
  previewSummary: {
    textAlign: 'center',
    fontWeight: 500,
  },
  previewSummaryError: {
    color: ({ palette }) => palette.text.warning,
  },
  nextRunContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
  },
  descriptionContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cronDescription: ({ palette }) => ({
    color: palette.secondary.main,
    fontSize: '0.75rem',
    textAlign: 'center',
  }),
  noticeContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    width: '100%',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    gap: '0.5rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.tips}`,
    background: ({ palette }) => palette.components.tips.background.main,
  },
  noticeIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.icon.tips,
    fill: palette.icon.tips,
  }),
  noticeText: ({ palette }) => ({
    flex: 1,
    color: palette.text.tips,
  }),
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    borderRadius: '0.5rem',
    padding: '0.5rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.error}`,
    background: ({ palette }) => palette.background.error,
    color: ({ palette }) => palette.text.error,
    gap: '0.5rem',
  },
  infoIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    width: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
  },
  cronWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
});

export default ScheduleSettingsSection;
