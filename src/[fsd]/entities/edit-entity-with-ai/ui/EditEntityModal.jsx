import { memo, useCallback, useRef, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { Input, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import EditEntityStepIndicator from './EditEntityStepIndicator';

const PHASES = {
  PROMPT: 'prompt',
  LOADING: 'loading',
  WIZARD: 'wizard',
};

const EditEntityModal = memo(props => {
  const {
    open,
    onClose,
    title = 'Edit with AI',
    entityLabel,
    placeholder,
    onGenerate,
    generateError,
    resetGenerate,
    onDraftGenerated,
    steps,
    renderStep,
    onSave,
    saveLabel,
    savingLabel,
    modalTestId,
    closeButtonTestId,
    promptInputTestId,
    errorAlertTestId,
    loadingIndicatorTestId,
    generateButtonTestId,
    cancelButtonTestId,
  } = props;

  const generatePromiseRef = useRef(null);

  const [phase, setPhase] = useState(PHASES.PROMPT);

  const [description, setDescription] = useState('');
  const [draftData, setDraftData] = useState(null);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }

    setPhase(PHASES.PROMPT);
    setDescription('');
    setDraftData(null);
    setActiveStepIndex(0);
    setIsSaving(false);
    resetGenerate();
    onClose();
  }, [onClose, resetGenerate]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    setPhase(PHASES.LOADING);
    setActiveStepIndex(0);
    resetGenerate();

    try {
      const promise = onGenerate(description);
      generatePromiseRef.current = promise;

      const result = await promise.unwrap();

      generatePromiseRef.current = null;

      setDraftData(result);
      onDraftGenerated?.(result);

      setPhase(PHASES.WIZARD);
    } catch {
      generatePromiseRef.current = null;
      setPhase(PHASES.PROMPT);
    }
  }, [description, onGenerate, resetGenerate, onDraftGenerated]);

  const handleRefinePrompt = useCallback(() => {
    setPhase(PHASES.PROMPT);
    setDraftData(null);
    setActiveStepIndex(0);
    resetGenerate();
  }, [resetGenerate]);

  const handlePrevious = useCallback(() => {
    setActiveStepIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveStepIndex(prev => Math.min((steps?.length ?? 1) - 1, prev + 1));
  }, [steps]);

  const handleSave = useCallback(async () => {
    if (!draftData) return;

    setIsSaving(true);

    try {
      await onSave(draftData);
      handleClose();
    } catch {
      setIsSaving(false);
    }
  }, [draftData, onSave, handleClose]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey && phase === PHASES.PROMPT) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate, phase],
  );

  const isLastStep = steps && activeStepIndex === steps.length - 1;

  const renderContent = () => {
    if (phase === PHASES.LOADING) {
      return (
        <Box
          sx={styles.loadingContainer}
          data-testid={loadingIndicatorTestId}
        >
          <CircularProgress size={24} />
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            {`Generating ${entityLabel} draft...`}
          </Typography>
        </Box>
      );
    }

    if (phase === PHASES.WIZARD && draftData && steps?.length > 0) {
      const activeStep = steps[activeStepIndex];

      return (
        <Box sx={styles.wizardContainer}>
          <EditEntityStepIndicator
            steps={steps}
            activeStepIndex={activeStepIndex}
          />
          <Box sx={styles.stepContent}>{renderStep(activeStep.key, draftData, setDraftData)}</Box>
        </Box>
      );
    }

    return (
      <Box sx={styles.inputContainer}>
        <Input.InputBase
          fullWidth
          multiline
          minRows={10}
          maxRows={16}
          placeholder={placeholder}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          disableUnderline
          sx={styles.textField}
          inputProps={{ 'data-testid': promptInputTestId }}
          enableAutoBlur={false}
        />
        {generateError && (
          <Alert
            severity="error"
            sx={styles.errorAlert}
            data-testid={errorAlertTestId}
          >
            {generateError?.data?.error ||
              generateError?.data?.detail ||
              'Failed to generate. Please try again.'}
          </Alert>
        )}
      </Box>
    );
  };

  const renderActions = () => {
    if (phase !== PHASES.PROMPT) return null;

    return (
      <>
        <Box sx={{ flex: 1 }} />
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={handleClose}
          data-testid={cancelButtonTestId}
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          disabled={!description.trim()}
          onClick={handleGenerate}
          sx={{ margin: '0 !important' }}
          data-testid={generateButtonTestId}
        >
          Generate Draft
        </BaseBtn>
      </>
    );
  };

  const renderWizardFooter = () => {
    if (phase !== PHASES.WIZARD) return null;

    const entityLabelCapitalized = entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);

    return (
      <Box sx={styles.wizardFooter}>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={handleRefinePrompt}
          disabled={isSaving}
        >
          Refine Prompt
        </BaseBtn>
        <Box sx={styles.wizardFooterRight}>
          {activeStepIndex > 0 && (
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              size="small"
              onClick={handlePrevious}
              disabled={isSaving}
            >
              Previous
            </BaseBtn>
          )}
          {isLastStep ? (
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? savingLabel || 'Saving...' : saveLabel || `Save ${entityLabelCapitalized}`}
            </BaseBtn>
          ) : (
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              onClick={handleNext}
            >
              Next
            </BaseBtn>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Modal.BaseModal
      open={open}
      title={title}
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      footer={renderWizardFooter()}
      dialogSx={styles.dialogContent}
      sx={phase === PHASES.WIZARD ? styles.dialogWizard : styles.dialog}
      data-testid={modalTestId}
      closeButtonTestId={closeButtonTestId}
    />
  );
});

EditEntityModal.displayName = 'EditEntityModal';

/** @type {MuiSx} */
const styles = {
  dialog: () => ({
    width: '45rem !important',
    maxWidth: '90vw !important',
  }),
  dialogWizard: () => ({
    width: 'calc(100vw - 6rem) !important',
    maxWidth: '90vw !important',
  }),
  dialogContent: {
    maxHeight: 'calc(100vh - 16rem)',
    padding: '0 !important',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
    minHeight: '16rem',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '16rem',
    padding: '1rem 1.5rem',
  },
  textField: ({ palette }) => ({
    '& .MuiInputBase-root': {
      padding: 0,
      fontSize: '0.875rem',
      color: palette.text.secondary,
    },
  }),
  errorAlert: {
    mt: 1,
  },
  wizardContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  stepContent: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  wizardFooter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  wizardFooterRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
};

export default EditEntityModal;
