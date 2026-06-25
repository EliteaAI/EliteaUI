import { memo, useCallback, useRef, useState } from 'react';

import { Alert, Box, CircularProgress, TextField, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { buildErrorMessage } from '@/common/utils.jsx';
import useToast from '@/hooks/useToast.jsx';

const STEPS = {
  INPUT: 'input',
  LOADING: 'loading',
  REVIEW: 'review',
};

const GenerateEntityModal = memo(props => {
  const {
    open,
    onClose,
    entityLabel,
    placeholder,
    onGenerate,
    generateError,
    resetGenerate,
    onDraftGenerated,
    renderReview,
    onApprove,
    approveLabel,
    approvingLabel,
  } = props;

  const { toastError } = useToast();
  const styles = generateEntityModalStyles();

  const [step, setStep] = useState(STEPS.INPUT);
  const [description, setDescription] = useState('');
  const [draftData, setDraftData] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDraftValid, setIsDraftValid] = useState(true);
  const generatePromiseRef = useRef(null);

  const handleClose = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }
    setStep(STEPS.INPUT);
    setDescription('');
    setDraftData(null);
    setIsApproving(false);
    resetGenerate();
    onClose();
  }, [onClose, resetGenerate]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    setStep(STEPS.LOADING);
    resetGenerate();

    try {
      const promise = onGenerate(description);
      generatePromiseRef.current = promise;
      const result = await promise.unwrap();

      generatePromiseRef.current = null;
      setDraftData(result);
      onDraftGenerated?.();
      setStep(STEPS.REVIEW);
    } catch {
      generatePromiseRef.current = null;
      setStep(STEPS.INPUT);
    }
  }, [description, onGenerate, resetGenerate, onDraftGenerated]);

  const handleBack = useCallback(() => {
    setStep(STEPS.INPUT);
    setDraftData(null);
    resetGenerate();
  }, [resetGenerate]);

  const handleApprove = useCallback(async () => {
    if (!draftData) return;
    setIsApproving(true);

    try {
      await onApprove(draftData);
      handleClose();
    } catch (err) {
      setIsApproving(false);
      toastError(buildErrorMessage(err));
    }
  }, [draftData, onApprove, handleClose, toastError]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey && step === STEPS.INPUT) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate, step],
  );

  const entityLabelCapitalized = entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);

  const renderContent = () => {
    if (step === STEPS.LOADING) {
      return (
        <Box sx={styles.loadingContainer}>
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

    if (step === STEPS.REVIEW && draftData) {
      return renderReview(draftData, setDraftData, setIsDraftValid);
    }

    return (
      <Box sx={styles.inputContainer}>
        <TextField
          fullWidth
          multiline
          minRows={10}
          maxRows={16}
          placeholder={placeholder}
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          variant="standard"
          sx={styles.textField}
          slotProps={{ input: { disableUnderline: true } }}
        />
        {generateError && (
          <Alert
            severity="error"
            sx={styles.errorAlert}
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
    if (step === STEPS.LOADING) return null;

    if (step === STEPS.REVIEW) {
      return (
        <>
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            onClick={handleBack}
            disabled={isApproving}
          >
            Back to prompt
          </BaseBtn>
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            size="small"
            onClick={handleApprove}
            disabled={isApproving || !isDraftValid}
            sx={{ margin: '0 !important' }}
          >
            {isApproving
              ? (approvingLabel || 'Creating...')
              : (approveLabel || `Create ${entityLabelCapitalized}`)}
          </BaseBtn>
        </>
      );
    }

    return (
      <>
        <Box sx={{ flex: 1 }} />
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={handleClose}
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          disabled={!description.trim()}
          onClick={handleGenerate}
          sx={{ margin: '0 !important' }}
        >
          Generate
        </BaseBtn>
      </>
    );
  };

  return (
    <Modal.BaseModal
      open={open}
      title="Build with AI"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      dialogSx={styles.dialogContent}
      sx={styles.dialog}
    />
  );
});

GenerateEntityModal.displayName = 'GenerateEntityModal';

const generateEntityModalStyles = () => ({
  dialog: () => ({
    '& .MuiDialog-paper': {
      width: '45rem !important',
      maxWidth: '80% !important',
    },
  }),
  dialogContent: {
    maxHeight: 'calc(100vh - 16rem)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '16rem',
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
});

export default GenerateEntityModal;
