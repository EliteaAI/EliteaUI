import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Box, IconButton, TextField } from '@mui/material';

import StyledCircleProgress from '@/ComponentsLib/CircularProgress';
import Tooltip from '@/ComponentsLib/Tooltip';
import { SendButton } from '@/[fsd]/features/chat/ui/chat-button';
import HighlightedText from '@/[fsd]/features/chat/ui/highlighted-text/HighlightedText';
import { useFileDragAndDrop } from '@/[fsd]/shared/lib/hooks';
import useCtrlEnterKeyEventsHandler from '@/[fsd]/shared/lib/hooks/useCtrlEnterKeyEventsHandler.hooks';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import StopIcon from '@/assets/stop-icon.svg?react';
import { generateRandomAppendix, renameFile } from '@/common/attachmentValidationUtils';
import FileList from '@/components/Chat/FileList';

import { useMentionDetection } from './useMentionDetection';

const MAX_ROWS = 10;
const MIN_ROWS = 2;
const MIN_HEIGHT = 70;

const UserInput = forwardRef((props, ref) => {
  const {
    dataTourTargetId,
    slots: { footer } = {},
    slotProps: {
      container = {
        ref: null,
        borderColor: '#3B3E46',
        background: 'rgba(255, 255, 255, 0.05)',
      },
      input = {
        placeholder: '',
        color: '#FFFFFF',
        iconColor: '#0E131D',
      },
      sendButton = {
        iconColor: '#0E131D',
        disabledBackground: '#686C76',
        background: '#6ae8fa',
        size: '1.75rem',
      },
      stopButton = {
        iconColor: '#E97912',
        tooltip: {
          title: 'Stop generating',
          placement: 'top',
        },
      },
      mentionUser = {
        users: [],
        onMentionChange: () => {},
      },
      tooltip = {
        title: '',
        placement: 'top',
      },
      footerContainer = {},
      highlight = {},
    } = {},
    clearInputAfterSend = true,
    disabledSend,
    disabledInput,
    onSend,
    onStop,
    onNormalKeyDown,
    onInputChange,
    tooltipOfSendButton,
    showLoading = false,
    isStreaming = false,
    attachments = [],
    onDeleteAttachment,
    onFilePaste,
    isUploadingAttachments = false,
    uploadProgress = 0,
    isCreatingConversation = false,
    isRecording = false,
    isSpeakingMode = false,
    onEnterSpeakingMode,
    onExitSpeakingMode,
  } = props;

  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const inputContentRef = useRef('');
  // Desired cursor position to apply after the next render. Set by replaceRange/setValue/
  // insertTextAtCursor; consumed and cleared by the useEffect below.
  const pendingCursorRef = useRef(null);

  const [question, setQuestion] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [showExpandIcon, setShowExpandIcon] = useState(false);
  const [rows, setRows] = useState(MAX_ROWS);
  const [isFocused, setIsFocused] = useState(false);

  const setInputContentWithRef = useCallback(value => {
    inputContentRef.current = value;
    setInputContent(value);
  }, []);

  const { users = [], onMentionChange } = mentionUser || {};

  const { mentions } = useMentionDetection(inputContent, users, 'name', {
    allowPartialMatches: false,
    caseSensitive: false,
    minMatchLength: 1,
  });

  const originalOnDrop = container?.onDrop;

  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop: handleDropFromHook,
  } = useFileDragAndDrop(originalOnDrop);

  const { ranges: highlightRanges = [] } = highlight;
  const hasHighlights = highlightRanges.length > 0 && !!inputContent;

  const styles = userInputStyles(isFocused, isDragOver, isRecording);

  // Sync mirror size/scroll with the real textarea.
  // Uses a callback ref so we get called exactly when the mirror node appears/disappears.
  const mirrorCallbackRef = useCallback(
    node => {
      mirrorRef.current = node;
      if (!node) return;

      const textarea = inputRef.current;
      if (!textarea) return;

      const syncSize = () => {
        const cs = window.getComputedStyle(textarea);
        // Apply all layout-critical styles as inline so no MUI rule can override them
        node.style.cssText = `
          display: block !important;
          position: absolute;
          top: 0;
          left: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font: ${cs.font};
          line-height: ${cs.lineHeight};
          letter-spacing: ${cs.letterSpacing};
          padding: ${cs.padding};
          width: ${textarea.offsetWidth}px;
          height: ${textarea.offsetHeight}px;
        `;
      };

      syncSize();

      const syncScroll = () => {
        node.scrollTop = textarea.scrollTop;
      };

      textarea.addEventListener('scroll', syncScroll);
      const ro = new ResizeObserver(syncSize);
      ro.observe(textarea);

      // Store cleanup so we can call it when node is removed
      node._cleanup = () => {
        textarea.removeEventListener('scroll', syncScroll);
        ro.disconnect();
      };
    },

    [],
  );

  // Re-sync height when content changes (textarea grows/shrinks with rows)
  useEffect(() => {
    const textarea = inputRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;
    mirror.style.height = textarea.offsetHeight + 'px';
    mirror.style.width = textarea.offsetWidth + 'px';
    mirror.scrollTop = textarea.scrollTop;
  }, [inputContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mirrorRef.current?._cleanup?.();
    };
  }, []);

  useEffect(() => {
    onMentionChange?.(mentions);

    if (inputRef.current && mentions.length > 0) inputRef.current.focus();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentions]);

  const sendQuestion = useCallback(() => {
    if (question.trim() && !disabledSend) {
      if (clearInputAfterSend) {
        setInputContentWithRef('');
        setQuestion('');
        setShowExpandIcon(false);
      }

      onSend?.(question, inputContentRef.current);
    }
  }, [clearInputAfterSend, disabledSend, onSend, question, setInputContentWithRef]);

  // Helper function to insert text at cursor position
  const insertTextAtCursor = useCallback(
    textToInsert => {
      if (inputRef.current) {
        const textarea = inputRef.current;
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const currentValue = inputContentRef.current;

        const newValue = currentValue.slice(0, start) + textToInsert + currentValue.slice(end);

        setInputContentWithRef(newValue);
        setQuestion(newValue?.trim() ? newValue : '');

        const newCursorPosition = start + textToInsert.length;
        pendingCursorRef.current = newCursorPosition;
        setTimeout(() => {
          setShowExpandIcon(textarea.offsetHeight > MIN_HEIGHT);
        }, 0);
      }
    },
    [setInputContentWithRef],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        inputRef.current?.focus?.();
      },
      reset: () => {
        setInputContentWithRef('');
        setQuestion('');
        setShowExpandIcon(false);
      },
      getInputContent: () => inputContentRef.current,
      getCursorPosition: () => inputRef.current?.selectionStart ?? null,
      setValue: (value, cursorPos) => {
        setQuestion(value);
        setInputContentWithRef(value);
        if (cursorPos !== undefined) {
          pendingCursorRef.current = cursorPos;
        }
      },
      replaceRange: (start, end, text) => {
        const current = inputContentRef.current;
        const newValue = current.slice(0, start) + text + current.slice(end);
        setInputContentWithRef(newValue);
        setQuestion(newValue.trim() ? newValue : '');
        const newCursorPos = start + text.length;
        pendingCursorRef.current = newCursorPos;
      },
      removeSymbol: symbol => {
        const current = inputContentRef.current;
        const index = current.lastIndexOf(symbol);
        const newContent = current.slice(0, index);
        setQuestion(newContent.trimEnd());
        setInputContentWithRef(newContent.trimEnd());
      },
      sendQuestion,
      insertTextAtCursor,
      mentionUser: userString => {
        const current = inputContentRef.current;
        if (!current.includes(userString)) {
          const newContent = current + userString;
          setInputContentWithRef(newContent);
          setQuestion(newContent);
        }
      },
    }),
    [sendQuestion, insertTextAtCursor, setInputContentWithRef],
  );

  const onInputQuestion = event => {
    const value = event.target.value;
    setInputContentWithRef(value);
    setQuestion(value?.trim() ? value : '');
    onInputChange?.(value);
    setTimeout(() => {
      setShowExpandIcon(event.target.offsetHeight > MIN_HEIGHT);
    }, 0);
  };

  const onClickExpander = () => {
    setRows(prevRows => (prevRows === MAX_ROWS ? MIN_ROWS : MAX_ROWS));
  };

  const onCtrlEnterDown = useCallback(() => {
    insertTextAtCursor('\n');
  }, [insertTextAtCursor]);

  const onEnterDown = useCallback(() => {
    sendQuestion();
  }, [sendQuestion]);

  const handlePaste = useCallback(
    event => {
      const clipboardData = event.clipboardData || window.clipboardData;
      const items = clipboardData?.items;

      if (items) {
        const files = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          // Check if the clipboard item is a file (not text)
          if (item.kind === 'file') {
            const file = item.getAsFile();

            if (file) files.push(renameFile(file, generateRandomAppendix(file.size)));
          }
        }

        // If we found files, prevent default paste behavior and handle them
        if (files.length > 0 && onFilePaste) {
          event.preventDefault();
          // Pass single file or array of files depending on what was found
          onFilePaste(files.length === 1 ? files[0] : files);
          return;
        }
      }

      // For text content, let the default paste behavior handle it
    },
    [onFilePaste],
  );

  const { onKeyDown, onKeyUp, onCompositionStart, onCompositionEnd } = useCtrlEnterKeyEventsHandler({
    onCtrlEnterDown,
    onShiftEnterPressed: onCtrlEnterDown,
    onEnterDown,
    onNormalKeyDown,
  });

  useEffect(() => {
    if (!showExpandIcon) setRows(MAX_ROWS);
  }, [showExpandIcon]);

  return (
    <Box
      sx={styles.gradientBorder}
      data-tour={dataTourTargetId || undefined}
    >
      <Tooltip
        title={tooltip?.title}
        placement={tooltip?.placement}
      >
        <Box
          sx={styles.container}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          {...(container || {})}
          onDrop={handleDropFromHook}
        >
          {attachments?.length > 0 && (
            <FileList
              disabledDelete={isStreaming || showLoading}
              files={attachments}
              onDeleteFile={onDeleteAttachment}
            />
          )}
          <Box sx={styles.textFieldWrapper}>
            {hasHighlights && (
              <div ref={mirrorCallbackRef}>
                {/** we should use div for mirror here because we don't want the styls from MUI */}
                <HighlightedText
                  text={inputContent}
                  ranges={highlightRanges}
                />
              </div>
            )}
            <TextField
              data-testid="chat-input"
              value={inputContent}
              fullWidth
              id="standard-multiline-static"
              label=""
              multiline
              maxRows={rows}
              variant="standard"
              autoComplete="off"
              onChange={onInputQuestion}
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              onPaste={handlePaste}
              disabled={disabledInput}
              placeholder={isFocused ? '' : input?.placeholder}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              sx={styles.textField}
              slotProps={{
                htmlInput: { 'data-testid': 'chat-message-input', spellCheck: false },
                input: {
                  inputRef,
                  sx: [
                    styles.textFieldInput(input),
                    hasHighlights && {
                      '& textarea': { color: 'transparent', caretColor: input?.color ?? '#FFFFFF' },
                    },
                  ],
                  disableUnderline: true,
                  endAdornment: showExpandIcon ? (
                    <IconButton
                      size="small"
                      variant="icon"
                      color="tertiary"
                      sx={styles.expandButton}
                      onClick={onClickExpander}
                    >
                      {rows === MAX_ROWS ? (
                        <UnfoldLessIcon sx={styles.expandIcon(input)} />
                      ) : (
                        <UnfoldMoreIcon sx={styles.expandIcon(input)} />
                      )}
                    </IconButton>
                  ) : null,
                },
              }}
              {...(isCreatingConversation && { autoFocus: true })}
            />
          </Box>
          <Box
            sx={styles.footer}
            {...(footerContainer || {})}
          >
            {footer}
            {!isStreaming || isUploadingAttachments ? (
              <Box sx={styles.sendButtonContainer}>
                <SendButton
                  isSpeakingMode={isSpeakingMode}
                  question={question}
                  disabledSend={disabledSend}
                  onEnterSpeakingMode={onEnterSpeakingMode}
                  onExitSpeakingMode={onExitSpeakingMode}
                  onSend={onEnterDown}
                  tooltipOfSendButton={tooltipOfSendButton}
                  sendButton={sendButton}
                  styles={styles}
                />
                {showLoading && (
                  <StyledCircleProgress {...(isUploadingAttachments && { progress: uploadProgress })} />
                )}
              </Box>
            ) : (
              <Tooltip
                title={stopButton?.tooltip?.title || ''}
                placement="top"
              >
                <Box component="span">
                  <BaseBtn
                    variant="icon"
                    color="secondary"
                    sx={styles.stopButton(stopButton)}
                    onClick={onStop}
                  >
                    <StopIcon style={styles.stopIconStyle} />
                  </BaseBtn>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
});

UserInput.displayName = 'UserInput';

/** @type {MuiSx} */
const userInputStyles = (isFocused, isDragOver, isRecording) => {
  const getInputBackground = palette => {
    if (!isFocused && !isRecording) return palette.background.card.default;

    return palette.mode === 'light' ? palette.background.secondary : palette.background.onboardingBody;
  };

  const getInputBorder = palette => {
    if (isRecording) return palette.primary.main;
    if (!isFocused) return 'transparent';

    return `linear-gradient(0deg, ${palette.background.userInputBorderDark} 0%, ${palette.background.userInputBorderLight} 100%)`;
  };

  return {
    gradientBorder: ({ palette }) => ({
      width: '100%',
      padding: '0.0625rem',
      borderRadius: '1rem',
      background: getInputBorder(palette),

      ...((isFocused || isRecording) && {
        boxShadow: isRecording
          ? `0 0 0.75rem 0 ${palette.primary.main}40`
          : `0 -0.3125rem 1.25rem 0 ${palette.background.userInputBorderShadow}`,
      }),
    }),
    container: ({ palette }) => ({
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      padding: '.75rem 1rem',
      alignItems: 'flex-start',
      borderRadius: '1rem',
      background: isDragOver ? `${palette.primary.main}15` : getInputBackground(palette),
      border: isDragOver
        ? `0.125rem dashed ${palette.primary.main}`
        : `0.0625rem solid ${isFocused || isRecording ? 'transparent' : palette.border.lines}`,
      boxSizing: 'border-box',
      gap: '1.5rem',
      transition: 'all 0.2s ease-in-out',
      position: 'relative',
      ...(isDragOver && {
        boxShadow: `0 0.25rem 0.75rem ${palette.primary.main}30`,
      }),
    }),
    textFieldWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      position: 'relative',
    },
    textField: {
      padding: 0,
      flex: '1 0 0',
      fontSize: '.875rem',
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: '1.5rem',
      position: 'relative',
      zIndex: 1,
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      '& textarea': {
        marginBottom: 0,
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      },
    },
    textFieldInput: input => ({
      color: input?.color ?? '#FFFFFF',
      padding: 0,
    }),
    expandButton: {
      marginLeft: 0,
    },
    expandIcon: input => ({
      fontSize: '1rem',
      color: input?.iconColor ?? '#0E131D',
    }),
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      alignItems: 'center',
      minHeight: '2.5rem',
      gap: { xs: '.5rem', sm: '0.5rem' },
    },
    sendButtonContainer: {
      display: 'flex',
      height: 'auto',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButton: {
      height: '1.75rem',
      width: '1.75rem',
    },
    voiceModePill: ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      paddingLeft: '0.625rem',
      height: '1.75rem',
      borderRadius: '0.875rem',
      border: `0.0625rem solid ${palette.border.chatContinue}`,
      flexShrink: 0,
      color: palette.primary.main,
    }),
    voiceModeIcon: {
      width: '1.5rem',
      height: '1.5rem',
      flexShrink: 0,
    },
    voiceModeClose: ({ palette }) => ({
      width: '1.5rem',
      height: '1.5rem',
      color: palette.text.secondary,
      flexShrink: 0,
    }),
    sendButton: sendButton => ({
      height: sendButton?.size ?? '1.75rem',
      width: sendButton?.size ?? '1.75rem',
      backgroundColor: sendButton?.background ?? '#6ae8fa',
      '&.Mui-disabled': {
        backgroundColor: sendButton?.disabledBackground ?? '#686C76',
      },
      '&:hover': {
        backgroundColor: sendButton?.background ?? '#6ae8fa',
      },
      color: `${sendButton?.iconColor ?? '#0E131D'} !important`,
    }),
    sendIcon: sendButton => ({
      fontSize: '1.125rem',
      fill: `${sendButton?.iconColor ?? '#0E131D'} !important`,
    }),
    stopButton: stopButton => ({
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      color: `${stopButton?.iconColor ?? '#E97912'} !important`,
      marginLeft: 0,
    }),
    stopIconStyle: {
      fontSize: '1rem',
    },
  };
};

export default memo(UserInput);
