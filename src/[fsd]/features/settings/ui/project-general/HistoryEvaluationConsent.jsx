import { memo, useCallback, useState } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { useCanManageProjectSettings } from '@/[fsd]/features/settings/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Button, Checkbox, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { useEvalHistoryConsentQuery, useSetEvalHistoryConsentMutation } from '@/[fsd]/widgets/evaluation/api';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const CONSENT_TOOLTIP =
  'When the scheduled evaluation runs in **history** or **hybrid** mode, it scores agents from the chat turns they already answered instead of running them. Private chats are included. Each sampled turn is copied into the evaluation run and kept for as long as the run is. Only the chat author and project admins see the copied text; everyone else sees the scores. Secrets such as keys and tokens are masked, but **personal data is not**.';

const CONFIRM_TEXT =
  "The scheduled evaluation will read every member's chats with this project's agents, private ones included, and copy the sampled turns into evaluation runs. Personal data in them is not masked. Turn it on?";

const HistoryEvaluationConsent = memo(() => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const { canManageSettings, isLoading: isLoadingAdmin } = useCanManageProjectSettings();

  const { data, isError, isFetching, refetch } = useEvalHistoryConsentQuery(
    { projectId },
    { skip: !projectId },
  );
  const [setConsent, { isLoading: isSaving }] = useSetEvalHistoryConsentMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const styles = historyEvaluationConsentStyles(isError);

  const saveConsent = useCallback(
    async consent => {
      try {
        await setConsent({ projectId, consent }).unwrap();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the chat history evaluation setting');
      }
    },
    [projectId, setConsent, toastError],
  );

  // Turning it on exposes the project's chats to the pipeline, so it asks first; turning it off does not.
  const handleChange = useCallback(
    event => {
      if (event.target.checked) setConfirmOpen(true);
      else saveConsent(false);
    },
    [saveConsent],
  );

  const handleCancel = useCallback(() => setConfirmOpen(false), []);
  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    saveConsent(true);
  }, [saveConsent]);

  const disabled =
    !checkPermission(PERMISSIONS.projectContext.edit) ||
    !canManageSettings ||
    isError ||
    // A background refetch keeps the stored value, so only a first read locks the toggle.
    !data ||
    isSaving;

  return (
    <Box
      sx={styles.card}
      data-testid="evaluation-history-consent-card"
    >
      <Box sx={styles.titleGroup}>
        <FormControlLabel
          sx={styles.label}
          label={
            <Typography
              variant="headingSmall"
              color="text.secondary"
            >
              Evaluate agents from chat history
            </Typography>
          }
          control={
            <Checkbox.BaseCheckbox
              checked={data?.history_evaluation_consent ?? false}
              onChange={handleChange}
              disabled={disabled}
              slotProps={{ input: { 'aria-describedby': 'evaluation-history-consent-help' } }}
              data-testid="evaluation-history-consent-checkbox"
            />
          }
        />
        <InfoTooltip infoTooltip={CONSENT_TOOLTIP} />
      </Box>
      <Typography
        id="evaluation-history-consent-help"
        variant="bodySmall"
        sx={styles.description}
      >
        {isError
          ? 'Could not load the setting.'
          : 'Lets the scheduled evaluation score agents from their stored chats, private ones included. Chat text stays visible to its author and project admins only. Personal data is not masked.'}
      </Typography>
      {isError && (
        <Box>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.text}
            onClick={refetch}
            disabled={isFetching}
            data-testid="evaluation-history-consent-retry"
          >
            Retry
          </Button.BaseBtn>
        </Box>
      )}
      {!isLoadingAdmin && !canManageSettings && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="evaluation-history-consent-admin-hint"
        >
          Only project admins can change it.
        </Typography>
      )}
      <Modal.BaseModal
        open={confirmOpen}
        variant={ModalConstants.MODAL_VARIANT.simple}
        title="Evaluate agents from chat history?"
        content={<Typography variant="bodySmall">{CONFIRM_TEXT}</Typography>}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        confirmButtonText="Turn on"
        confirmButtonTestId="evaluation-history-consent-confirm"
        data-testid="evaluation-history-consent-dialog"
      />
    </Box>
  );
});

HistoryEvaluationConsent.displayName = 'HistoryEvaluationConsent';

/** @type {MuiSx} */
const historyEvaluationConsentStyles = isError => ({
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 1.5rem',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.surface.interactive.default,
    gap: '0.25rem',
  }),
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  label: {
    marginRight: 0,
  },
  description: ({ palette }) => ({
    color: isError ? palette.error.main : palette.text.primary,
  }),
});

export default HistoryEvaluationConsent;
