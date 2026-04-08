import { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Button, IconButton, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { useAIContentGenerationStreaming } from '@/[fsd]/features/pipelines/ai-assistant/lib/hooks';
import { AIAssistantPanelHeader, AIPromptInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import AIAssistantCodeMirrorInput from '@/[fsd]/features/pipelines/ai-assistant/ui/AIAssistantCodeMirrorInput';
import {
  formatAvailableNodesForPrompt,
  formatStateVariablesForPrompt,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/state.helpers';
import { Modal, Text } from '@/[fsd]/shared/ui';
import { capitalizeFirstChar } from '@/common/utils';
import CloseIcon from '@/components/Icons/CloseIcon';
import CopyIcon from '@/components/Icons/CopyIcon';
import { detectContentType, useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';
import useToast from '@/hooks/useToast';

const AIAssistantModal = memo(props => {
  const {
    open,
    onClose,
    hasOnChangeCallback,
    onChange,
    onInput,
    onKeyDown,
    value = '',
    title,
    name,
    id,
    specifiedLanguage,
    disabled,
    modelConfig,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
    fieldName = '', // Add fieldName prop
  } = props;

  const styles = aiAssistantModalStyles();
  const theme = useTheme();

  // Extract pipeline state and nodes from context (if available)
  const flowEditorContext = useContext(FlowEditorContext);
  const pipelineState = flowEditorContext?.yamlJsonObject?.state;
  const pipelineNodes = flowEditorContext?.yamlJsonObject?.nodes;

  // Format state variables for AI prompt
  const stateVariablesInfo = useMemo(() => {
    return formatStateVariablesForPrompt(pipelineState);
  }, [pipelineState]);

  // Format available nodes for AI prompt (for router)
  const availableNodesInfo = useMemo(() => {
    return formatAvailableNodesForPrompt(pipelineNodes);
  }, [pipelineNodes]);

  const { toastInfo, toastError } = useToast();
  const [currentValue, setCurrentValue] = useState(value);
  const [improvedContent, setImprovedContent] = useState('');
  const [showSplitView, setShowSplitView] = useState(false);
  const editorRef = useRef();
  const improvedEditorRef = useRef();
  const wasGeneratingRef = useRef(false);
  const promptInputRef = useRef(null);
  const prevOpenRef = useRef(false);

  const { generateContent, cancel, isGenerating, streamedContent, hasError, resetContent } =
    useAIContentGenerationStreaming({
      modelConfig,
      fieldName, // Pass fieldName to the hook
      stateVariablesInfo, // Pass formatted state variables
      availableNodesInfo, // Pass formatted available nodes
    });
  const { extensions, onChangeLanguage, language } = useLanguageLinter(
    specifiedLanguage,
    undefined,
    isGenerating,
  );

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Autofocus prompt input when modal just opened
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Delay focus slightly to ensure children mounted
      requestAnimationFrame(() => {
        promptInputRef.current?.focus?.();
      });
    }
    prevOpenRef.current = open;
  }, [open]);

  const onNotifyChange = newValue => {
    setCurrentValue(newValue);
  };

  const handleBlur = useCallback(
    contentOverride => {
      const commitValue = typeof contentOverride === 'string' ? contentOverride : currentValue;
      const event = {
        preventDefault: () => {},
        target: { value: commitValue, name, id },
      };
      hasOnChangeCallback ? onChange?.(event) : onInput?.(event);
    },
    [currentValue, hasOnChangeCallback, id, name, onChange, onInput],
  );

  /**
   * Detect and update language if content type changed
   */
  const updateLanguageIfChanged = useCallback(
    content => {
      const detectedLanguage = detectContentType(content);
      if (detectedLanguage && detectedLanguage !== language) {
        onChangeLanguage(detectedLanguage);
      }
    },
    [language, onChangeLanguage],
  );

  // Sync streamedContent to improvedContent (split view) or currentValue (single view)
  useEffect(() => {
    if (streamedContent) {
      if (showSplitView) {
        // In split view, update improved content
        setImprovedContent(streamedContent);
      } else {
        // In single view, update current value directly
        setCurrentValue(streamedContent);
      }
    }
  }, [streamedContent, showSplitView]);

  // Auto-commit changes when generation completes in single view mode
  useEffect(() => {
    if (isGenerating) {
      wasGeneratingRef.current = true;
    } else if (wasGeneratingRef.current && !showSplitView && streamedContent) {
      wasGeneratingRef.current = false;

      updateLanguageIfChanged(streamedContent);

      // Pass streamedContent directly to avoid stale currentValue closure
      handleBlur(streamedContent);

      if (!hasError) {
        promptInputRef.current?.clear();
      }
    } else if (wasGeneratingRef.current && showSplitView && !isGenerating) {
      // Generation just finished in split view mode
      wasGeneratingRef.current = false;

      if (!hasError) {
        promptInputRef.current?.clear();
      }
    }
  }, [isGenerating, showSplitView, streamedContent, handleBlur, updateLanguageIfChanged, hasError]);

  const onClickClose = useCallback(() => {
    handleBlur();
    onClose?.();
  }, [handleBlur, onClose]);

  const onClickCopyCurrent = () => {
    navigator.clipboard.writeText(currentValue);
    toastInfo('Current content has been copied to the clipboard');
  };

  const onClickCopyImproved = () => {
    navigator.clipboard.writeText(improvedContent);
    toastInfo('Improved content has been copied to the clipboard');
  };

  const isErrorContent = useCallback(content => {
    return content && content.trim() && content.trimStart().startsWith('Error');
  }, []);

  const handleAIGenerate = useCallback(
    async prompt => {
      try {
        // Reset any previous streamed content
        resetContent();
        setImprovedContent('');

        // Check if current content is an error (starts with "Error")
        const isCurrentContentError = isErrorContent(currentValue);

        // Check if improved content has an error (in split view)
        const isImprovedContentError = isErrorContent(improvedContent);

        // If we're in split view and the improved content had an error, retry improvement
        if (showSplitView && (hasError || isImprovedContentError)) {
          // Keep split view open, keep current content, just regenerate improved content
          // Current content stays visible on the left
          await generateContent(prompt, currentValue);
          // Prompt will be cleared by useEffect if successful
        } else if (isCurrentContentError) {
          // If current content itself is an error (in single view), clear it and regenerate from scratch
          setCurrentValue('');
          setShowSplitView(false);
          await generateContent(prompt, '');
          // Prompt will be cleared by useEffect if successful
        } else if (currentValue && currentValue.trim()) {
          // Show split view if we have valid current content to compare against
          setShowSplitView(true);
          // Start streaming generation with current content as context
          await generateContent(prompt, currentValue);
          // Prompt will be cleared by useEffect or handleApply if successful
        } else {
          // For empty content, show in single view
          setShowSplitView(false);
          await generateContent(prompt, '');
          // Prompt will be cleared by useEffect if successful
        }
        // Content will be accumulated via streamMessage state
      } catch (error) {
        toastError(`Failed to generate content: ${error.message}`);
        // Keep prompt on error - don't clear so user can retry
        throw error;
      }
    },
    [
      generateContent,
      currentValue,
      improvedContent,
      showSplitView,
      hasError,
      toastError,
      resetContent,
      isErrorContent,
    ],
  );

  const handleApply = useCallback(() => {
    // Apply improved content
    setCurrentValue(improvedContent);

    const event = {
      preventDefault: () => {},
      target: { value: improvedContent, name, id },
    };
    hasOnChangeCallback ? onChange?.(event) : onInput?.(event);

    // Detect and update language if changed
    updateLanguageIfChanged(improvedContent);

    // Return to single view
    setShowSplitView(false);
    setImprovedContent('');
    resetContent();

    // Clear prompt after successful apply (only if no error)
    if (!hasError) {
      promptInputRef.current?.clear();
    }
  }, [
    improvedContent,
    name,
    id,
    hasOnChangeCallback,
    onChange,
    onInput,
    resetContent,
    updateLanguageIfChanged,
    hasError,
  ]);

  const handleCloseSplitView = useCallback(() => {
    setShowSplitView(false);
    setImprovedContent('');
    resetContent();
  }, [resetContent]);

  const handleStop = useCallback(() => {
    cancel();
  }, [cancel]);

  const contentBackgroundSx = showSplitView
    ? ({ palette }) => ({
        background: `linear-gradient(90deg, ${palette.background.secondary} 0%, ${palette.background.card.hover} 100%)`,
      })
    : ({ palette }) => ({
        background: `linear-gradient(90deg, ${palette.background.tabPanel} 0%, ${palette.background.default} 100%)`,
      });

  return (
    <Modal.StyledInputModalBase
      open={open}
      onClose={onClickClose}
      title={capitalizeFirstChar(title)}
      value={value}
      specifiedLanguage={specifiedLanguage}
      language={language}
      onLanguageChange={onChangeLanguage}
      contentBackgroundSx={contentBackgroundSx}
    >
      <Box sx={styles.contentWrapper}>
        {showSplitView ? (
          // Split view: Current Version (left) and Improved Version (right)
          <Box sx={styles.splitViewContainer}>
            {/* Current Version - Left Panel */}
            <Box sx={styles.panelContainer}>
              <AIAssistantPanelHeader
                title="Current Version"
                actions={
                  <StyledTooltip
                    title="Copy current version"
                    placement="top"
                  >
                    <IconButton
                      variant="icon"
                      color="tertiary"
                      onClick={onClickCopyCurrent}
                      sx={styles.iconButton}
                    >
                      <CopyIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </StyledTooltip>
                }
              />
              <Box sx={styles.editorContainer}>
                <Box sx={styles.currentEditorWrapper}>
                  <AIAssistantCodeMirrorInput
                    readOnly={isGenerating}
                    editorRef={editorRef}
                    value={currentValue}
                    extensions={extensions}
                    notifyChange={onNotifyChange}
                    enableFStringAutocomplete={enableFStringAutocomplete}
                    stateVariableOptions={stateVariableOptions}
                  />
                </Box>
              </Box>
            </Box>

            {/* Improved Version - Right Panel */}
            <Box sx={styles.improvedPanelContainer}>
              <AIAssistantPanelHeader
                title="Improved Version"
                actions={
                  <>
                    <Box
                      component="span"
                      sx={styles.buttonWrapper}
                    >
                      <Button
                        variant="secondary"
                        onClick={handleApply}
                        disabled={isGenerating}
                      >
                        Apply
                      </Button>
                    </Box>
                    <StyledTooltip
                      title="Copy improved version"
                      placement="top"
                    >
                      <IconButton
                        variant="icon"
                        color="tertiary"
                        onClick={onClickCopyImproved}
                        sx={styles.iconButton}
                      >
                        <CopyIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </StyledTooltip>
                    <StyledTooltip
                      title="Close split view"
                      placement="top"
                    >
                      <IconButton
                        variant="icon"
                        color="tertiary"
                        onClick={handleCloseSplitView}
                        sx={styles.iconButton}
                      >
                        <CloseIcon
                          fill={theme.palette.icon.fill.default}
                          sx={{ fontSize: '1rem' }}
                        />
                      </IconButton>
                    </StyledTooltip>
                  </>
                }
              />
              <Box sx={styles.improvedEditorContainer}>
                <Box sx={styles.improvedEditorWrapper}>
                  <AIAssistantCodeMirrorInput
                    readOnly={isGenerating}
                    editorRef={improvedEditorRef}
                    value={improvedContent}
                    extensions={extensions}
                    notifyChange={setImprovedContent}
                    enableFStringAutocomplete={enableFStringAutocomplete}
                    stateVariableOptions={stateVariableOptions}
                  />
                  {isGenerating && !improvedContent && (
                    <Box sx={styles.singleViewLoadingContainer}>
                      <Text.AnimatedLoadingText text="Thinking..." />
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          // Single view: Editable CodeMirror
          <Box sx={styles.singleViewContainer}>
            <AIAssistantCodeMirrorInput
              readOnly={disabled || isGenerating}
              editorRef={editorRef}
              value={currentValue}
              extensions={extensions}
              notifyChange={onNotifyChange}
              onBlur={handleBlur}
              onKeyDown={onKeyDown}
              enableFStringAutocomplete={enableFStringAutocomplete}
              stateVariableOptions={stateVariableOptions}
            />
            {isGenerating && !currentValue && (
              <Box sx={styles.singleViewLoadingContainer}>
                <Text.AnimatedLoadingText text="Thinking..." />
              </Box>
            )}
          </Box>
        )}
      </Box>
      <AIPromptInput
        disabled={disabled || isGenerating}
        onGenerate={handleAIGenerate}
        onStop={handleStop}
        isLoading={isGenerating}
        promptValueRef={promptInputRef}
      />
    </Modal.StyledInputModalBase>
  );
});

AIAssistantModal.displayName = 'AIAssistantModal';

/** @type {MuiSx} */
const aiAssistantModalStyles = () => ({
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflowY: 'auto',
  },
  splitViewContainer: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
  panelContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  },
  improvedPanelContainer: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    borderLeft: `.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
    backgroundColor: palette.background.card.hover,
  }),
  iconButton: ({ spacing }) => ({
    padding: spacing(0.5),
  }),
  buttonWrapper: {
    display: 'inline-block',
  },
  editorContainer: {
    flex: 1,
    minHeight: 0,
  },
  currentEditorWrapper: ({ palette, spacing }) => ({
    height: '100%',
    backgroundColor: palette.background.secondary,
    position: 'relative',
    '& .cm-editor': {
      backgroundColor: palette.background.secondary,
    },
    '& .cm-scroller': {
      backgroundColor: palette.background.secondary,
    },
    '& .cm-content': {
      paddingTop: spacing(1),
      paddingBottom: spacing(20),
    },
    '& .cm-gutters': {
      backgroundColor: palette.background.secondary,
      borderRight: `.0313rem solid ${palette.border.lines}`,
    },
    '& .cm-lineNumbers .cm-gutterElement': {
      paddingTop: spacing(0.1),
    },
    '& .cm-lint-marker': {
      position: 'relative',
      top: '0.25rem',
    },
  }),
  improvedEditorContainer: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    position: 'relative',
    backgroundColor: palette.background.card.hover,
  }),
  improvedEditorWrapper: ({ palette, spacing }) => ({
    height: '100%',
    backgroundColor: palette.background.card.hover,
    position: 'relative',
    '& .cm-editor': {
      backgroundColor: palette.background.card.hover,
    },
    '& .cm-scroller': {
      backgroundColor: palette.background.card.hover,
    },
    '& .cm-content': {
      paddingTop: spacing(1),
      paddingBottom: spacing(20),
    },
    '& .cm-gutters': {
      backgroundColor: palette.background.card.hover,
      borderRight: `.0313rem solid ${palette.border.lines}`,
    },
    '& .cm-lineNumbers .cm-gutterElement': {
      paddingTop: spacing(0.1),
    },
    '& .cm-lint-marker': {
      position: 'relative',
      top: '0.25rem',
    },
  }),
  loadingContainer: ({ spacing }) => ({
    position: 'absolute',
    top: spacing(2),
    left: spacing(2),
    zIndex: 10,
  }),
  singleViewContainer: ({ spacing }) => ({
    flex: 1,
    minHeight: 0,
    position: 'relative',
    '& .cm-content': {
      paddingTop: spacing(1),
      paddingBottom: spacing(10),
    },
    '& .cm-lineNumbers .cm-gutterElement': {
      paddingTop: spacing(0.1),
    },
    '& .cm-lint-marker': {
      position: 'relative',
      top: '0.25rem',
    },
  }),
  singleViewLoadingContainer: ({ spacing }) => ({
    position: 'absolute',
    top: spacing(1), // Align with .cm-content paddingTop
    left: spacing(6.25),
    zIndex: 10,
  }),
});

export default AIAssistantModal;
