import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { useCanManageProjectSettings } from '@/[fsd]/features/settings/lib/hooks';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { Checkbox } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import { useEvalHistoryConsentQuery, useSetEvalHistoryConsentMutation } from '@/[fsd]/widgets/evaluation/api';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

const CONSENT_TOOLTIP =
  'When the scheduled evaluation runs in **history** or **hybrid** mode, it scores agents from the chat turns they already answered instead of running them. Private chats are included. Each sampled turn is copied into the evaluation run and kept for as long as the run is. Only the chat author and project admins see the copied text; everyone else sees the scores. Secrets such as keys and tokens are masked, but **personal data is not**.';

const HistoryEvaluationConsent = memo(() => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const { checkPermission } = useCheckPermission();
  const { canManageSettings, isLoading: isLoadingAdmin } = useCanManageProjectSettings();

  const { data, isError, isFetching } = useEvalHistoryConsentQuery({ projectId }, { skip: !projectId });
  const [setConsent, { isLoading: isSaving }] = useSetEvalHistoryConsentMutation();
  const styles = historyEvaluationConsentStyles(isError);

  const handleChange = useCallback(
    async event => {
      try {
        await setConsent({ projectId, consent: event.target.checked }).unwrap();
      } catch (error) {
        toastError(error?.data?.error || 'Unable to update the chat history evaluation setting');
      }
    },
    [projectId, setConsent, toastError],
  );

  const disabled =
    !checkPermission(PERMISSIONS.projectContext.edit) ||
    !canManageSettings ||
    isError ||
    !data ||
    isFetching ||
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
          ? 'Could not load the setting'
          : 'Lets the scheduled evaluation score agents from their stored chats, private ones included. Chat text stays visible to its author and project admins only. Personal data is not masked.'}
      </Typography>
      {!isLoadingAdmin && !canManageSettings && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="evaluation-history-consent-admin-hint"
        >
          Only project admins can change it.
        </Typography>
      )}
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
