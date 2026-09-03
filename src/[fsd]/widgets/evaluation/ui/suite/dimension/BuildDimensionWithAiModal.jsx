import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Alert, Box, CircularProgress, TextField, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { useCreateEvalDimensionMutation, useGenerateEvalDimensionsMutation } from '../../../api';
import {
  buildDimensionApiBody,
  getDefaultDimensionFormState,
  getDimensionFormValidationError,
  mapGeneratedDimensionToForm,
  parseEvalError,
} from '../../../lib/helpers';
import DimensionForm from './DimensionForm';

const STEPS = {
  INPUT: 'input',
  LOADING: 'loading',
  SELECT: 'select',
  REVIEW: 'review',
};

const BuildDimensionWithAiModal = memo(props => {
  const { open, onClose, projectId, applicationId = null, onSaved } = props;

  const [step, setStep] = useState(STEPS.INPUT);
  const [prompt, setPrompt] = useState('');
  const [generatedDimensions, setGeneratedDimensions] = useState([]);
  const [form, setForm] = useState(getDefaultDimensionFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [generateError, setGenerateError] = useState(null);
  const generatePromiseRef = useRef(null);

  const [generateDimensions] = useGenerateEvalDimensionsMutation();
  const [createDimension, { isLoading: isCreating }] = useCreateEvalDimensionMutation();

  useEffect(() => {
    if (open) {
      setStep(STEPS.INPUT);
      setPrompt('');
      setGeneratedDimensions([]);
      setForm(getDefaultDimensionFormState());
      setErrorMessage('');
      setGenerateError(null);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }
    onClose();
  }, [onClose]);

  const handlePromptChange = useCallback(event => {
    setPrompt(event.target.value);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setStep(STEPS.LOADING);
    setGenerateError(null);

    try {
      const promise = generateDimensions({
        projectId,
        body: {
          prompt: prompt.trim(),
          application_id: applicationId,
        },
      });
      generatePromiseRef.current = promise;
      const result = await promise.unwrap();
      generatePromiseRef.current = null;

      const dims = result?.dimensions ?? (Array.isArray(result) ? result : [result]);
      setGeneratedDimensions(dims);

      if (dims.length === 1) {
        setForm(mapGeneratedDimensionToForm(dims[0]));
        setStep(STEPS.REVIEW);
      } else {
        setStep(STEPS.SELECT);
      }
    } catch (err) {
      generatePromiseRef.current = null;
      setGenerateError(err);
      setStep(STEPS.INPUT);
    }
  }, [prompt, generateDimensions, projectId, applicationId]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey && step === STEPS.INPUT) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate, step],
  );

  const handleBackToPrompt = useCallback(() => {
    setStep(STEPS.INPUT);
    setGenerateError(null);
  }, []);

  const handleBackToSelect = useCallback(() => {
    setStep(STEPS.SELECT);
    setErrorMessage('');
  }, []);

  const handleSelectDimension = useCallback(dimension => {
    setForm(mapGeneratedDimensionToForm(dimension));
    setStep(STEPS.REVIEW);
  }, []);

  const validationError = getDimensionFormValidationError(form);

  const handleSave = useCallback(async () => {
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setErrorMessage('');

    const body = buildDimensionApiBody(form, applicationId);

    try {
      const result = await createDimension({ projectId, body }).unwrap();
      onSaved?.(result, form.evaluationTarget, form.evaluator);
      handleClose();
    } catch (error) {
      setErrorMessage(parseEvalError(error, 'Failed to create dimension.'));
    }
  }, [validationError, form, applicationId, createDimension, projectId, onSaved, handleClose]);

  const styles = buildDimensionWithAiModalStyles();

  const renderInputContent = () => (
    <Box sx={styles.inputContainer}>
      <TextField
        fullWidth
        multiline
        minRows={10}
        maxRows={16}
        placeholder="Describe the evaluation dimension you want to create. For example: 'Check if the response is polite and professional' or 'Verify that the output contains valid JSON'"
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyDown}
        autoFocus
        variant="standard"
        sx={styles.textField}
        slotProps={{
          input: { disableUnderline: true },
          htmlInput: { 'data-testid': 'build-dimension-prompt-input' },
        }}
      />
      {generateError && (
        <Alert
          severity="error"
          sx={styles.errorAlert}
          data-testid="build-dimension-generate-error"
        >
          {generateError?.data?.error ||
            generateError?.data?.detail ||
            'Failed to generate dimension. Please try again.'}
        </Alert>
      )}
    </Box>
  );

  const renderLoadingContent = () => (
    <Box
      sx={styles.loadingContainer}
      data-testid="build-dimension-loading"
    >
      <CircularProgress size={24} />
      <Typography
        color="text.secondary"
        sx={styles.loadingText}
      >
        Generating dimension drafts...
      </Typography>
    </Box>
  );

  const renderSelectContent = () => (
    <Box
      sx={styles.selectContainer}
      data-testid="build-dimension-select-list"
    >
      <Typography
        variant="bodyMedium"
        sx={styles.selectHint}
      >
        Select a dimension to review and customize:
      </Typography>
      <Box sx={styles.selectList}>
        {generatedDimensions.map((dim, index) => (
          <Box
            key={dim.name || index}
            sx={styles.selectCard}
            onClick={() => handleSelectDimension(dim)}
            data-testid={`build-dimension-select-${index}`}
          >
            <Typography
              variant="bodyMedium"
              sx={styles.selectCardName}
            >
              {dim.name}
            </Typography>
            {dim.description && (
              <Typography
                variant="bodySmall"
                sx={styles.selectCardDescription}
              >
                {dim.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderReviewContent = () => (
    <DimensionForm
      form={form}
      setForm={setForm}
      errorMessage={errorMessage}
    />
  );

  const renderContent = () => {
    if (step === STEPS.LOADING) return renderLoadingContent();
    if (step === STEPS.SELECT) return renderSelectContent();
    if (step === STEPS.REVIEW) return renderReviewContent();
    return renderInputContent();
  };

  const renderActions = () => {
    if (step === STEPS.LOADING) return null;

    if (step === STEPS.REVIEW) {
      return (
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={generatedDimensions.length > 1 ? handleBackToSelect : handleBackToPrompt}
            disabled={isCreating}
            data-testid="build-dimension-back-button"
          >
            {generatedDimensions.length > 1 ? 'Back to list' : 'Back to prompt'}
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={handleSave}
            disabled={isCreating || !!validationError}
            data-testid="build-dimension-save-button"
          >
            {isCreating ? 'Creating...' : 'Create Dimension'}
          </Button.BaseBtn>
        </>
      );
    }

    if (step === STEPS.SELECT) {
      return (
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleBackToPrompt}
            data-testid="build-dimension-back-button"
          >
            Back to prompt
          </Button.BaseBtn>
          <Box sx={styles.actionSpacer} />
        </>
      );
    }

    return (
      <>
        <Box sx={styles.actionSpacer} />
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.secondary}
          onClick={handleClose}
          data-testid="build-dimension-cancel-button"
        >
          Cancel
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          disabled={!prompt.trim()}
          onClick={handleGenerate}
          data-testid="build-dimension-generate-button"
        >
          Generate Draft
        </Button.BaseBtn>
      </>
    );
  };

  const isWideStep = step === STEPS.REVIEW || step === STEPS.SELECT;

  return (
    <Modal.BaseModal
      open={open}
      title="Build with AI"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      variant={step === STEPS.REVIEW ? ModalConstants.MODAL_VARIANT.complex : undefined}
      sx={isWideStep ? styles.dialogPaperWide : styles.dialogPaper}
      dialogSx={step === STEPS.REVIEW ? styles.dialogReview : styles.dialogInput}
      data-testid="build-dimension-with-ai-modal"
    />
  );
});

BuildDimensionWithAiModal.displayName = 'BuildDimensionWithAiModal';

/** @type {MuiSx} */
const buildDimensionWithAiModalStyles = () => ({
  dialogPaper: {
    '& .MuiDialog-paper': {
      width: '45rem !important',
      maxWidth: '80% !important',
    },
  },
  dialogPaperWide: {
    '& .MuiDialog-paper': {
      width: '50rem !important',
      maxWidth: '80% !important',
    },
  },
  dialogInput: {
    maxHeight: 'calc(100vh - 16rem)',
  },
  dialogReview: {
    minHeight: '32rem',
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
  },
  loadingText: {
    fontSize: '0.875rem',
  },
  selectContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    minHeight: '16rem',
  },
  selectHint: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.875rem',
  }),
  selectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
  },
  selectCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
    backgroundColor: palette.background.aiProviderAccordion.default,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: palette.background.aiProviderAccordion.hover,
      borderColor: palette.border.lines,
    },
  }),
  selectCardName: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  selectCardDescription: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  }),
  actionSpacer: {
    flex: 1,
  },
});

export default BuildDimensionWithAiModal;
