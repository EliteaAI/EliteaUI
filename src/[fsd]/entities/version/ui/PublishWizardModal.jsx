import { memo, useCallback, useMemo } from 'react';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  IconButton,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useCtrlEnterKeyEventsHandler } from '@/components/Chat/hooks';
import CloseIcon from '@/components/Icons/CloseIcon';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';

import PreparationStep from './PreparationStep';
import ValidationStep from './ValidationStep';

export const PUBLISH_STEPS = { PREPARATION: 0, VALIDATION: 1, PUBLISHING: 2 };

const STEP_LABELS = ['Preparation', 'Validation', 'Publishing'];

const PublishWizardModal = memo(
  ({
    open,
    isAdminPublish,
    step,
    versionName,
    onVersionNameChange,
    agreed,
    onAgreedChange,
    validationResult,
    publishError,
    versionNameError,
    isValidating,
    onClose,
    onContinue,
    onPublish,
  }) => {
    const canContinue = useMemo(
      () =>
        versionName.trim().length > 0 && agreed && /^[a-zA-Z0-9._-]+$/.test(versionName) && !versionNameError,
      [versionName, agreed, versionNameError],
    );

    const canAdminPublish = useMemo(
      () => versionName.trim().length > 0 && /^[a-zA-Z0-9._-]+$/.test(versionName) && !versionNameError,
      [versionName, versionNameError],
    );

    const canPublish = useMemo(
      () => validationResult?.status !== 'FAIL' && !publishError,
      [validationResult, publishError],
    );

    const handleEnterDown = useCallback(
      event => {
        if (isAdminPublish && canAdminPublish) {
          event.stopPropagation();
          event.preventDefault();
          onPublish();
        } else if (step === PUBLISH_STEPS.PREPARATION && canContinue) {
          event.stopPropagation();
          event.preventDefault();
          onContinue();
        }
      },
      [isAdminPublish, canAdminPublish, step, canContinue, onContinue, onPublish],
    );

    const { onKeyDown, onKeyUp, onCompositionStart, onCompositionEnd } = useCtrlEnterKeyEventsHandler({
      onEnterDown: handleEnterDown,
    });

    const handleDialogKeyDown = useCallback(
      event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
        onKeyDown(event);
      },
      [onClose, onKeyDown],
    );

    return (
      <StyledDialog
        open={!!open}
        onClose={onClose}
        onKeyDown={handleDialogKeyDown}
        onKeyUp={onKeyUp}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        aria-labelledby="publish-wizard-title"
        sx={styles.dialog}
      >
        <DialogTitle
          id="publish-wizard-title"
          sx={styles.dialogTitle}
        >
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Publish version
          </Typography>
          <IconButton
            variant="elitea"
            color="tertiary"
            aria-label="close"
            onClick={onClose}
            sx={{ padding: 0, margin: 0 }}
          >
            <CloseIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </DialogTitle>

        {!isAdminPublish && (
          <Box sx={styles.stepperContainer}>
            <Stepper
              activeStep={step}
              sx={styles.stepper}
            >
              {STEP_LABELS.map((label, index) => (
                <Step
                  key={label}
                  sx={index < step ? styles.completedStep : styles.defaultStep}
                >
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        <DialogContent sx={styles.dialogContent}>
          {isAdminPublish ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                Enter a version name to publish.
              </Typography>
              <TextField
                fullWidth
                variant="standard"
                label="Version name"
                autoComplete="off"
                value={versionName}
                onChange={e => {
                  if (/^[a-zA-Z0-9._-]*$/.test(e.target.value)) onVersionNameChange(e.target.value);
                }}
                error={!!(versionNameError || publishError)}
                helperText={
                  versionNameError ||
                  publishError ||
                  'Only letters, numbers, dots, hyphens and underscores allowed.'
                }
                inputProps={{ maxLength: 50 }}
              />
            </Box>
          ) : (
            <>
              {step === PUBLISH_STEPS.PREPARATION && (
                <PreparationStep
                  versionName={versionName}
                  onVersionNameChange={onVersionNameChange}
                  agreed={agreed}
                  onAgreedChange={onAgreedChange}
                  error={versionNameError || (step === PUBLISH_STEPS.PREPARATION ? publishError : undefined)}
                />
              )}

              {step === PUBLISH_STEPS.VALIDATION && (
                <ValidationStep
                  isValidating={isValidating}
                  validationResult={validationResult}
                />
              )}

              {step === PUBLISH_STEPS.PUBLISHING && !publishError && (
                <Box sx={styles.publishingState}>
                  <CircularProgress size={48} />
                  <Typography
                    variant="bodySmall"
                    color="text.secondary"
                    sx={{ marginTop: '1.5rem' }}
                  >
                    Publishing your agent...
                  </Typography>
                </Box>
              )}

              {publishError && step !== PUBLISH_STEPS.PREPARATION && (
                <Alert
                  severity="error"
                  sx={{ marginTop: '1rem' }}
                >
                  {publishError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <StyledDialogActions sx={styles.dialogActions}>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          {isAdminPublish ? (
            <Button
              variant="contained"
              disabled={!canAdminPublish}
              onClick={onPublish}
            >
              Publish
            </Button>
          ) : (
            <>
              {step === PUBLISH_STEPS.PREPARATION && (
                <Button
                  variant="contained"
                  disabled={!canContinue}
                  onClick={onContinue}
                >
                  Continue
                </Button>
              )}

              {step === PUBLISH_STEPS.VALIDATION && validationResult && (
                <Button
                  variant="contained"
                  disabled={!canPublish}
                  onClick={onPublish}
                >
                  Publish
                </Button>
              )}

              {step === PUBLISH_STEPS.PUBLISHING && publishError && (
                <Button
                  variant="contained"
                  disabled
                >
                  Publish
                </Button>
              )}
            </>
          )}
        </StyledDialogActions>
      </StyledDialog>
    );
  },
);

PublishWizardModal.displayName = 'PublishWizardModal';

/** @type {MuiSx} */
const styles = {
  dialog: {
    '& .MuiDialog-paper': {
      width: '37.5rem !important',
      maxWidth: '90vw !important',
    },
  },
  dialogTitle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
  },
  stepperContainer: {
    padding: '0.75rem 1.5rem',
    margin: '0 1.5rem',
    boxSizing: 'border-box',
    width: 'calc(100% - 3rem)',
  },
  stepper: {
    '& .MuiStepLabel-label': {
      fontSize: '0.75rem',
    },
    '& .MuiStepConnector-root': {
      marginLeft: 0,
      marginRight: 0,
    },
  },
  defaultStep: ({ palette }) => ({
    border: `1px solid ${palette.border.lines}`,
    borderRadius: '2rem',
    padding: '0.25rem 0.75rem',
  }),
  completedStep: ({ palette }) => ({
    border: `1px solid ${palette.info.main}`,
    borderRadius: '2rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: alpha(palette.info.main, 0.2),
  }),
  dialogContent: ({ palette }) => ({
    width: '100%',
    overflow: 'auto',
    maxHeight: 'calc(100vh - 20rem)',
    boxSizing: 'border-box',
    padding: '1.5rem !important',
    background: `${palette.background.secondary} !important`,
  }),
  dialogActions: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    padding: '.75rem 1.5rem !important',
    gap: '.75rem',
  },
  publishingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
};

export default PublishWizardModal;
