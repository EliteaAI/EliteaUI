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
  Typography,
} from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import { useCtrlEnterKeyEventsHandler } from '@/components/Chat/hooks';
import CloseIcon from '@/components/Icons/CloseIcon';
import { StyledDialog, StyledDialogActions } from '@/components/StyledDialog';

import { VERSION_NAME_MAX_LENGTH, VERSION_NAME_REGEX } from '../lib/constants/version.constants';
import PreparationStep from './PreparationStep';
import ValidationStep from './ValidationStep';

export const PUBLISH_STEPS = { PREPARATION: 0, VALIDATION: 1, PUBLISHING: 2 };

const STEP_LABELS = ['Preparation', 'Validation', 'Publishing'];

const getStepStyle = (index, step, styles) => {
  if (index < step) return styles.completedStep;
  if (index === step) return styles.activeStep;
  return styles.defaultStep;
};

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

    const handleVersionNameChange = useCallback(
      e => {
        const value = e.target.value;
        if (VERSION_NAME_REGEX.test(value)) onVersionNameChange(value);
      },
      [onVersionNameChange],
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
                  sx={[styles.configStep, getStepStyle(index, step, styles)]}
                >
                  <StepLabel slots={{ stepIcon: CheckedIcon }}>{label}</StepLabel>
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
                sx={{ display: 'flex', alignSelf: 'center' }}
              >
                Enter a version name to publish.
              </Typography>
              <Input.InputBase
                label="Version name"
                autoComplete="off"
                value={versionName}
                onChange={handleVersionNameChange}
                error={!!(versionNameError || publishError)}
                helperText={
                  versionNameError ||
                  publishError ||
                  'Only letters, numbers, dots, hyphens and underscores allowed.'
                }
                inputProps={{ maxLength: VERSION_NAME_MAX_LENGTH }}
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

        <StyledDialogActions
          disableSpacing
          sx={styles.dialogActions}
        >
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
      height: '38.75rem',
      borderRadius: '1rem !important',
    },
  },
  dialogTitle: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3.75rem',
    padding: '1rem 1.5rem',
    borderBottom: `1px solid ${palette.border.lines}`,
    backgroundColor: `${palette.background.tabPanel}`,
  }),
  stepperContainer: {
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  stepper: ({ palette }) => ({
    width: '100%',
    '& .MuiStep-root': {
      flex: '0 0 auto',
    },
    '& .MuiStepLabel-label': {
      fontSize: '0.75rem',
    },
    '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
      borderColor: `${palette.step.completed.border} !important`,
    },
  }),
  configStep: {
    borderRadius: '2rem',
    padding: '0.25rem 0.75rem 0.25rem 0.25rem',
    '& .MuiStepLabel-iconContainer': {
      width: '1.5rem',
      height: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '1.5rem',
      marginRight: '0.5rem',
      padding: '0',
      '& svg': {
        width: '0.75rem',
        height: '0.75rem',
      },
    },
  },
  defaultStep: ({ palette }) => ({
    border: `1px solid ${palette.step.default.border}`,
    '& .MuiStepLabel-iconContainer': {
      backgroundColor: palette.step.default.icon,
      color: palette.secondary.main,
    },
    '& .MuiStepLabel-label': {
      color: palette.secondary.main,
    },
  }),
  activeStep: ({ palette }) => ({
    border: `1px solid ${palette.step.active}`,
    '& .MuiStepLabel-iconContainer': {
      backgroundColor: palette.step.active,
      color: palette.text.tag.selected,
    },
    '& .MuiStepLabel-label.Mui-active': {
      color: palette.text.secondary,
    },
  }),
  completedStep: ({ palette }) => ({
    border: `1px solid ${palette.step.completed.border}`,
    backgroundColor: palette.step.completed.background,
    '& .MuiStepLabel-iconContainer': {
      backgroundColor: palette.step.completed.icon,
      color: palette.text.tag.selected,
    },
    '& .MuiStepLabel-label': {
      color: palette.text.secondary,
    },
  }),
  dialogContent: ({ palette }) => ({
    width: '100%',
    overflow: 'hidden',
    maxHeight: 'calc(100vh - 20rem)',
    boxSizing: 'border-box',
    padding: '0.875rem 1.5rem !important',
    background: `${palette.background.secondary} !important`,
  }),
  dialogActions: ({ palette }) => ({
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    padding: '1rem 1.5rem !important',
    gap: '.75rem',
    borderTop: `1px solid ${palette.border.lines}`,
    backgroundColor: `${palette.background.tabPanel}`,
  }),
  publishingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
};

export default PublishWizardModal;
