import { memo, useCallback, useEffect, useRef } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Banner, Input, Modal } from '@/[fsd]/shared/ui';

import { BUILD_DIMENSION_STEPS } from '../../lib/constants';
import { useBuildDimensionWithAi } from '../../lib/hooks';
import BuildDimensionWithAiActions from './BuildDimensionWithAiActions';
import DimensionForm from './DimensionForm';
import GeneratedDimensionsList from './GeneratedDimensionsList';

// Mirrors GenerateEvalDimensionsRequest.custom_instructions max_length on the backend.
const MAX_PROMPT_LENGTH = 2000;

const FORM_ERRORS_ALERT = 'Some required fields are missing or contain invalid values.';

const BuildDimensionWithAiModal = memo(props => {
  const { open, onClose, projectId, applicationId = null, onSaved } = props;

  const {
    step,
    prompt,
    drafts,
    selectedIds,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    editingForm,
    setEditingForm,
    fieldErrors,
    showValidation,
    hasEditingErrors,
    generateError,
    saveError,
    isSaving,
    handleClose,
    handlePromptChange,
    handleGenerate,
    handleRefinePrompt,
    handleToggleSelect,
    handleToggleSelectAll,
    handleOpenDraft,
    handleSaveDraftAndBack,
    handleBackToList,
    handleSaveSelected,
  } = useBuildDimensionWithAi({ open, onClose, onSaved, projectId, applicationId });

  const contentRef = useRef(null);

  // The dialog content is one scroll container shared by every step, so a new step (or a failed
  // save whose alert sits at the top of the form) would otherwise open wherever the last one was left.
  const scrollContentToTop = useCallback(() => {
    contentRef.current?.parentElement?.scrollTo?.({ top: 0 });
  }, []);

  useEffect(() => {
    scrollContentToTop();
  }, [step, scrollContentToTop]);

  const handleSaveDraftAndBackClick = useCallback(() => {
    handleSaveDraftAndBack();
    if (hasEditingErrors) scrollContentToTop();
  }, [handleSaveDraftAndBack, hasEditingErrors, scrollContentToTop]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate],
  );

  const styles = buildDimensionWithAiModalStyles();

  const renderInputContent = () => (
    <Box sx={styles.stepContainer}>
      <Input.InputBase
        fullWidth
        multiline
        minRows={10}
        maxRows={12}
        placeholder="Describe the evaluation dimension you want to create. For example: 'Check if the response is polite and professional' or 'Verify that the output contains valid JSON'"
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyDown}
        autoFocus
        variant="standard"
        disableUnderline
        showCopyAction={false}
        showFullScreenAction={false}
        showExpandAction={false}
        sx={styles.textField}
        inputProps={{ 'data-testid': 'build-dimension-prompt-input', maxLength: MAX_PROMPT_LENGTH }}
      />
      {generateError && (
        <Box data-testid="build-dimension-generate-error">
          <Banner.BannerMessage
            variant="error"
            message={
              generateError?.data?.error ||
              generateError?.data?.detail ||
              'Failed to generate dimension. Please try again.'
            }
          />
        </Box>
      )}
    </Box>
  );

  const renderLoadingContent = () => (
    <Box
      sx={[styles.stepContainer, styles.loadingContainer]}
      data-testid="build-dimension-loading"
    >
      <CircularProgress size={24} />
      <Typography
        variant="bodyMedium"
        sx={styles.loadingText}
      >
        Generating dimension drafts...
      </Typography>
    </Box>
  );

  const renderSelectContent = () => (
    <GeneratedDimensionsList
      drafts={drafts}
      selectedIds={selectedIds}
      isAllSelected={isAllSelected}
      isIndeterminate={isIndeterminate}
      saveError={saveError}
      isDisabled={isSaving}
      onToggle={handleToggleSelect}
      onToggleAll={handleToggleSelectAll}
      onOpen={handleOpenDraft}
    />
  );

  const renderReviewContent = () => (
    <Box sx={styles.reviewContainer}>
      {showValidation && hasEditingErrors && (
        <Box data-testid="build-dimension-form-errors-alert">
          <Banner.BannerMessage
            variant="error"
            message={FORM_ERRORS_ALERT}
            containerSx={styles.formErrorsAlert}
          />
        </Box>
      )}
      <DimensionForm
        form={editingForm}
        setForm={setEditingForm}
        fieldErrors={fieldErrors}
        showValidation={showValidation}
      />
    </Box>
  );

  const renderContent = () => {
    if (step === BUILD_DIMENSION_STEPS.loading) return renderLoadingContent();
    if (step === BUILD_DIMENSION_STEPS.select) return renderSelectContent();
    if (step === BUILD_DIMENSION_STEPS.review && editingForm) return renderReviewContent();
    return renderInputContent();
  };

  const isPromptStep = step === BUILD_DIMENSION_STEPS.input || step === BUILD_DIMENSION_STEPS.loading;

  return (
    <Modal.BaseModal
      open={open}
      title="Build with AI"
      onClose={handleClose}
      content={<Box ref={contentRef}>{renderContent()}</Box>}
      actions={
        <BuildDimensionWithAiActions
          step={step}
          canGenerate={!!prompt.trim()}
          selectedCount={selectedCount}
          isSaving={isSaving}
          onCancel={handleClose}
          onGenerate={handleGenerate}
          onRefinePrompt={handleRefinePrompt}
          onSaveSelected={handleSaveSelected}
          onSaveDraftAndBack={handleSaveDraftAndBackClick}
          onBackToList={handleBackToList}
        />
      }
      sx={styles.dialogPaper}
      dialogSx={isPromptStep ? styles.dialogContentPrompt : styles.dialogContentList}
      data-testid="build-dimension-with-ai-modal"
    />
  );
});

BuildDimensionWithAiModal.displayName = 'BuildDimensionWithAiModal';

/** @type {MuiSx} */
const buildDimensionWithAiModalStyles = () => ({
  dialogPaper: {
    maxWidth: '80% !important',
    // The select step lays its footer out in three groups (refine / counter / cancel + save), which
    // needs the actions bar to span the dialog instead of hugging the right edge.
    '& .MuiDialogActions-root': {
      alignSelf: 'stretch',
    },
  },
  dialogContentPrompt: {
    padding: '1rem 1.5rem !important',
  },
  dialogContentList: {
    padding: '1rem 1.5rem !important',
    maxHeight: 'calc(100vh - 16rem)',
  },
  // Input and loading share one height so the modal does not jump while a draft is generated.
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '16rem',
  },
  textField: ({ palette }) => ({
    margin: 0,
    '& .MuiInputBase-root': {
      padding: 0,
      margin: 0,
      fontSize: '0.875rem',
      color: palette.text.secondary,
    },
    '& .MuiInputBase-input': {
      paddingTop: 0,
    },
  }),
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  loadingText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  reviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formErrorsAlert: {
    marginTop: 0,
  },
});

export default BuildDimensionWithAiModal;
