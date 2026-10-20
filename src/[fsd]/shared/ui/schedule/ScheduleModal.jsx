import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box } from '@mui/material';

import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import ScheduleSettingsSection from './ScheduleSettingsSection';

const { convertCronTimezone, getBrowserTimezone, validateCronExpression } = ScheduleHelpers;

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

  // The schedule is stored in the timezone of whoever configured it, but everything in this modal -
  // the builder, the cron expression and the next run - is shown and edited in the viewer's own
  // timezone. Saving sends the edited expression back paired with the viewer's timezone.
  const browserTimezone = useMemo(() => getBrowserTimezone(), []);

  useEffect(() => {
    if (open) {
      setCronExpression(convertCronTimezone(cron || DEFAULT_CRON, timezone, browserTimezone));
    }
  }, [open, cron, timezone, browserTimezone]);

  const cronState = useMemo(() => validateCronExpression(cronExpression), [cronExpression]);

  const applyIsDisabled = !cronState.isValid || isLoading;

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
          <ScheduleSettingsSection
            value={cronExpression}
            onChange={setCronExpression}
            sourceTimezone={timezone}
          />
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
  actionsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    gap: '0.75rem',
  },
});

export default ScheduleModal;
