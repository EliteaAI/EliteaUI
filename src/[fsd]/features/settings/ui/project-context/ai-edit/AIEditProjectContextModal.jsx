import { memo, useCallback, useRef, useState } from 'react';

import { Alert, Box, CircularProgress, TextField, Typography } from '@mui/material';

import { EditEntityComparisonLayout, TextDiffHighlight } from '@/[fsd]/entities/edit-entity-with-ai';
import { useGenerateProjectContextDraftMutation } from '@/[fsd]/features/settings/api/generateProjectContextDraftApi';
import { PROJECT_CONTEXT_MAX_LEN } from '@/[fsd]/features/settings/lib/constants/projectContext.constants';
import { Modal, Text } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { buildErrorMessage } from '@/common/utils.jsx';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';

const STEPS = {
  INPUT: 'input',
  LOADING: 'loading',
  DIFF: 'diff',
};

const AIEditProjectContextModal = memo(props => {
  const { open, onClose, currentContent, onApplySave } = props;

  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const [generateDraft, { error: generateError, reset: resetGenerate }] =
    useGenerateProjectContextDraftMutation();

  const [step, setStep] = useState(STEPS.INPUT);
  const [description, setDescription] = useState('');
  const [suggested, setSuggested] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const generatePromiseRef = useRef(null);

  const current = currentContent || '';

  const resetState = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }
    setStep(STEPS.INPUT);
    setDescription('');
    setSuggested('');
    setIsApplying(false);
    resetGenerate();
  }, [resetGenerate]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    setStep(STEPS.LOADING);
    resetGenerate();

    try {
      const promise = generateDraft({
        projectId,
        user_description: description,
        current_content: current,
      });
      generatePromiseRef.current = promise;
      const result = await promise.unwrap();

      generatePromiseRef.current = null;
      setSuggested(result.project_background || '');
      setStep(STEPS.DIFF);
    } catch {
      generatePromiseRef.current = null;
      setStep(STEPS.INPUT);
    }
  }, [description, generateDraft, projectId, current, resetGenerate]);

  const handleRefine = useCallback(() => {
    setStep(STEPS.INPUT);
    setSuggested('');
    resetGenerate();
  }, [resetGenerate]);

  const handleApplySave = useCallback(async () => {
    if (!suggested.trim()) return;
    setIsApplying(true);
    try {
      await onApplySave(suggested);
      handleClose();
    } catch (err) {
      setIsApplying(false);
      toastError(buildErrorMessage(err));
    }
  }, [suggested, onApplySave, handleClose, toastError]);

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey && step === STEPS.INPUT) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate, step],
  );

  const styles = getStyles();

  const renderContent = () => {
    if (step === STEPS.LOADING) {
      return (
        <Box
          sx={styles.loadingContainer}
          data-testid="ai-edit-project-context-loading-indicator"
        >
          <CircularProgress size={24} />
          <Typography
            color="text.secondary"
            sx={styles.loadingText}
          >
            Generating project context draft...
          </Typography>
        </Box>
      );
    }

    if (step === STEPS.DIFF) {
      return (
        <EditEntityComparisonLayout
          currentContent={
            <Box sx={styles.column}>
              <Box sx={styles.readOnlyCard}>
                {current ? (
                  <TextDiffHighlight
                    original={current}
                    modified={suggested}
                    mode="original"
                  />
                ) : (
                  <Typography sx={styles.emptyText}>No content</Typography>
                )}
              </Box>
            </Box>
          }
          suggestedContent={
            <Box sx={styles.column}>
              <Box sx={styles.editableCard}>
                <TextDiffHighlight
                  original={current}
                  modified={suggested}
                  mode="modified"
                  editable
                  onChange={setSuggested}
                  maxLength={PROJECT_CONTEXT_MAX_LEN}
                />
              </Box>
              <Text.CharacterCounter
                value={suggested}
                maxLength={PROJECT_CONTEXT_MAX_LEN}
                hideMaxLimitMessage
                sx={styles.characterCounter}
              />
            </Box>
          }
        />
      );
    }

    return (
      <Box sx={styles.inputContainer}>
        <TextField
          fullWidth
          multiline
          minRows={10}
          maxRows={16}
          placeholder="Describe the changes you'd like to make to the project context. AI can help improve and update the Project Background content."
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          variant="standard"
          sx={styles.textField}
          slotProps={{ input: { disableUnderline: true } }}
          inputProps={{ 'data-testid': 'ai-edit-project-context-prompt-input' }}
        />
        {generateError && (
          <Alert
            severity="error"
            sx={styles.errorAlert}
            data-testid="ai-edit-project-context-error-alert"
          >
            {generateError?.data?.error ||
              generateError?.data?.detail ||
              'Failed to generate. Please try again.'}
          </Alert>
        )}
      </Box>
    );
  };

  const isDiff = step === STEPS.DIFF;

  const renderActions = () => {
    if (step !== STEPS.INPUT) return null;

    return (
      <>
        <Box sx={styles.actionsSpacer} />
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={handleClose}
          data-testid="ai-edit-project-context-cancel-button"
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          disabled={!description.trim()}
          onClick={handleGenerate}
          sx={styles.primaryAction}
          data-testid="ai-edit-project-context-generate-button"
        >
          Generate Draft
        </BaseBtn>
      </>
    );
  };

  const renderDiffFooter = () => {
    if (!isDiff) return null;

    return (
      <Box sx={styles.diffFooter}>
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={handleRefine}
          disabled={isApplying}
          data-testid="ai-edit-project-context-refine-button"
        >
          Refine Prompt
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          onClick={handleApplySave}
          disabled={isApplying || !suggested.trim()}
          sx={styles.primaryAction}
          data-testid="ai-edit-project-context-apply-button"
        >
          {isApplying ? 'Applying...' : 'Apply & Save'}
        </BaseBtn>
      </Box>
    );
  };

  return (
    <Modal.BaseModal
      open={open}
      title="Edit with AI"
      onClose={handleClose}
      content={renderContent()}
      actions={renderActions()}
      footer={renderDiffFooter()}
      dialogSx={styles.dialogContent}
      sx={isDiff ? styles.dialogWide : styles.dialog}
      data-testid="ai-edit-project-context-modal"
      closeButtonTestId="ai-edit-project-context-close-button"
    />
  );
});

AIEditProjectContextModal.displayName = 'AIEditProjectContextModal';

/** @type {MuiSx} */
const getStyles = () => ({
  dialog: {
    width: '45rem !important',
    maxWidth: '90vw !important',
  },
  dialogWide: {
    width: 'calc(100vw - 6rem) !important',
    maxWidth: '90vw !important',
    height: 'calc(100vh - 6rem) !important',
    maxHeight: '90vh !important',
  },
  dialogContent: {
    flex: 1,
    minHeight: 0,
    maxHeight: 'none',
    padding: '0 !important',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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
  loadingText: {
    fontSize: '0.875rem',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '16rem',
    padding: '1rem 1.5rem',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem 1.5rem 1.25rem',
    flex: 1,
    minHeight: 0,
  },
  readOnlyCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
  }),
  editableCard: ({ palette }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: palette.border.hover },
    '&:focus-within': { borderColor: palette.primary.main },
  }),
  characterCounter: {
    alignSelf: 'flex-end',
  },
  emptyText: {
    fontSize: '0.75rem',
    color: 'text.primary',
    fontStyle: 'italic',
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
  actionsSpacer: {
    flex: 1,
  },
  primaryAction: {
    margin: '0 !important',
  },
  diffFooter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    flexShrink: 0,
    boxSizing: 'border-box',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
});

export default AIEditProjectContextModal;
