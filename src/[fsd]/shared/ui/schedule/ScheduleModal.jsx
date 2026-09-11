import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  canConvertCronTimezone,
  convertCronTimezone,
  getBrowserTimezone,
  getNextCronRun,
  validateCronExpression,
} from '@/[fsd]/shared/lib/helpers/schedule.helpers';
import { Button, Modal, Tab } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import ErrorIcon from '@/assets/error-icon.svg?react';
import InfoIcon from '@/assets/info.svg?react';
import FormInput from '@/components/FormInput';

import CronBuilder from './CronBuilder';

const viewButtons = [
  { value: 'builder', label: 'Builder' },
  { value: 'cron', label: 'Cron Expression' },
];

const DEFAULT_CRON = '0 0 * * 6';

const ScheduleModal = memo(props => {
  const {
    open,
    onClose,
    onSubmit,
    cron,
    timezone,
    isLoading = false,
    isEdit = false,
    title,
    children,
    closeOnSubmit = true,
  } = props;

  const styles = scheduleModalStyles();

  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);
  const [cronType, setCronType] = useState('builder');

  // The schedule is stored in the timezone of whoever configured it, but everything in this modal -
  // the builder, the cron expression and the next run - is shown and edited in the viewer's own
  // timezone. Saving sends the edited expression back paired with the viewer's timezone.
  const browserTimezone = useMemo(() => getBrowserTimezone(), []);

  const isForeignTimezone = Boolean(timezone && browserTimezone && timezone !== browserTimezone);

  useEffect(() => {
    if (open) {
      setCronExpression(convertCronTimezone(cron || DEFAULT_CRON, timezone, browserTimezone));
    }

    return () => {
      setCronType('builder');
    };
  }, [open, cron, timezone, browserTimezone]);

  const timezoneNotice = useMemo(() => {
    if (!isForeignTimezone) return null;

    if (!canConvertCronTimezone(cron || DEFAULT_CRON, timezone, browserTimezone)) {
      return `This schedule was configured in ${timezone} and its expression cannot be converted automatically, so the times below are shown as configured. Saving will reinterpret them in your timezone (${browserTimezone}).`;
    }

    return `This schedule was configured in ${timezone}. The times below are converted to your timezone (${browserTimezone}) and will be saved in it.`;
  }, [isForeignTimezone, cron, timezone, browserTimezone]);

  const cronState = useMemo(() => validateCronExpression(cronExpression), [cronExpression]);

  const nextRunComputed = useMemo(() => {
    if (!cronState.isValid) return null;
    const date = getNextCronRun(cronExpression);
    if (!date) return null;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [cronExpression, cronState.isValid]);

  const applyIsDisabled = useMemo(() => !cronState.isValid || isLoading, [cronState.isValid, isLoading]);

  const applyChanges = useCallback(() => {
    onSubmit(cronExpression);
    if (closeOnSubmit) {
      onClose();
    }
  }, [onSubmit, cronExpression, onClose, closeOnSubmit]);

  const modalTitle = title ?? (isEdit ? 'Edit Schedule' : 'Create Schedule');

  return (
    <Modal.BaseModal
      data-testid="pipeline-schedule-settings-modal"
      open={open}
      onClose={(_, reason) => reason !== 'backdropClick' && onClose()}
      title={modalTitle}
      sx={styles.dialog}
      content={
        <Box sx={styles.contentWrapper}>
          <Box sx={styles.tabRow}>
            <Tab.TabGroupButton
              data-testid="pipeline-schedule-mode-tabs"
              arrayBtn={viewButtons}
              value={cronType}
              onChange={(_, newValue) => setCronType(newValue)}
              disableTooltip
            />
          </Box>

          {cronType === 'builder' ? (
            <Box sx={styles.cronWrapper}>
              <CronBuilder
                value={cronExpression}
                onChange={setCronExpression}
                invalidField={cronState.isValid ? null : cronState.field}
              />
            </Box>
          ) : (
            <Box sx={styles.cronWrapper}>
              <FormInput
                data-testid="pipeline-schedule-cron-input"
                value={cronExpression}
                onChange={event => setCronExpression(event.target.value)}
                placeholder="* * * * *"
                error={!cronState.isValid}
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

          <Box sx={styles.previewBox}>
            <Typography
              data-testid="pipeline-schedule-summary-text"
              variant="headingSmall"
              sx={styles.previewSummary}
            >
              {cronState.isValid ? `"${cronState.message}"` : '-'}
            </Typography>

            <Box sx={styles.nextRunContainer}>
              <Typography
                variant="bodySmall"
                color="text.primary"
              >
                Next run:
              </Typography>
              <Typography variant="labelSmall">{cronState.isValid ? nextRunComputed : '-'}</Typography>
            </Box>
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

          {!cronState.isValid && (
            <Box sx={styles.errorContainer}>
              <ErrorIcon />
              <Typography
                variant="labelSmall"
                sx={styles.previewSummaryError}
              >
                {cronState.message}
              </Typography>
            </Box>
          )}

          {children}
        </Box>
      }
      actions={
        <Box sx={styles.actionsWrapper}>
          <Button.BaseBtn
            data-testid="pipeline-schedule-modal-cancel-button"
            sx={styles.actionBtn}
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onClose}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            data-testid="pipeline-schedule-modal-save-button"
            sx={styles.actionBtn}
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={applyChanges}
            disabled={applyIsDisabled}
          >
            Save
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

ScheduleModal.displayName = 'ScheduleModal';

/** @type {MuiSx} */
const scheduleModalStyles = () => ({
  dialog: {
    width: '38.74rem',
    maxWidth: 'none',
  },
  actionBtn: {
    width: '4.25rem',
  },
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
  actionsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    gap: '0.75rem',
  },
  previewBox: {
    padding: '1rem',
    borderRadius: '0.5rem',
    background: ({ palette }) => palette.background.userInputBackground,
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
    color: ({ palette }) => palette.text.warningText,
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
    background: ({ palette }) => palette.background.tips.main,
  },
  noticeIcon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    color: palette.icon.fill.tips,
    fill: palette.icon.fill.tips,
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
    border: ({ palette }) => `1px solid ${palette.border.error}`,
    background: ({ palette }) => palette.background.errorBkg,
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

export default ScheduleModal;
