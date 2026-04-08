import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Box, IconButton, TextField } from '@mui/material';

import StyledCircleProgress from '@/ComponentsLib/CircularProgress';
import Tooltip from '@/ComponentsLib/Tooltip';
import { useFileDragAndDrop } from '@/[fsd]/shared/lib/hooks';
import StopIcon from '@/assets/stop-icon.svg?react';
import { generateRandomAppendix, renameFile } from '@/common/attachmentValidationUtils';
import FileList from '@/components/Chat/FileList';
import SendIcon from '@/components/Icons/SendIcon';
import useCtrlEnterKeyEventsHandler from '@/hooks/useCtrlEnterKeyEventsHandler';

import { useMentionDetection } from './useMentionDetection';

const MAX_ROWS = 10;
const MIN_ROWS = 2;
const MIN_HEIGHT = 70;

const UserInput = forwardRef((props, ref) => {
  const {
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
    } = {},
    clearInputAfterSend = true,
    disabledSend,
    disabledInput,
    onSend,
    onStop,
    onNormalKeyDown,
    tooltipOfSendButton,
    showLoading = false,
    isStreaming = false,
    attachments = [],
    onDeleteAttachment,
    onFilePaste,
    isUploadingAttachments = false,
    uploadProgress = 0,
    isCreatingConversation = false,
  } = props;

  const inputRef = useRef(null);

  const [question, setQuestion] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [showExpandIcon, setShowExpandIcon] = useState(false);
  const [rows, setRows] = useState(MAX_ROWS);
  const [isFocused, setIsFocused] = useState(false);

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

  const styles = userInputStyles(isFocused, isDragOver);

  useEffect(() => {
    onMentionChange?.(mentions);

    if (inputRef.current && mentions.length > 0) inputRef.current.focus();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentions]);

  const sendQuestion = useCallback(() => {
    if (question.trim() && !disabledSend) {
      if (clearInputAfterSend) {
        setInputContent('');
        setQuestion('');
        setShowExpandIcon(false);
      }

      onSend?.(question, inputContent);
    }
  }, [clearInputAfterSend, disabledSend, onSend, question, inputContent]);

  // Helper function to insert text at cursor position
  const insertTextAtCursor = useCallback(
    textToInsert => {
      if (inputRef.current) {
        const textarea = inputRef.current;
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const currentValue = inputContent;

        // Create new value with text inserted at cursor position
        const newValue = currentValue.slice(0, start) + textToInsert + currentValue.slice(end);

        // Update the state
        setInputContent(newValue);
        setQuestion(newValue?.trim() ? newValue : '');

        // Restore cursor position after the inserted text
        const newCursorPosition = start + textToInsert.length;

        // Use setTimeout to ensure the DOM is updated before setting cursor position
        setTimeout(() => {
          if (textarea && textarea.setSelectionRange) {
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            textarea.focus();
          }

          // Update expand icon state
          setShowExpandIcon(textarea.offsetHeight > MIN_HEIGHT);
        }, 0);
      }
    },
    [inputContent],
  );

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus?.();
    },
    reset: () => {
      setInputContent('');
      setQuestion('');
      setShowExpandIcon(false);
    },
    getInputContent: () => inputContent,
    setValue: value => {
      setQuestion(value);
      setInputContent(value);
    },
    removeSymbol: symbol => {
      const index = inputContent.lastIndexOf(symbol);
      const newContent = inputContent.slice(0, index);
      setQuestion(newContent.trimEnd());
      setInputContent(newContent.trimEnd());
    },
    sendQuestion,
    insertTextAtCursor,
    mentionUser: userString => {
      if (!inputContent.includes(userString)) {
        const newContent = inputContent + userString;
        setInputContent(newContent);
        setQuestion(newContent);
      }
    },
  }));

  const onInputQuestion = event => {
    setInputContent(event.target.value);
    setQuestion(event.target.value?.trim() ? event.target.value : '');
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
    <Box sx={styles.gradientBorder}>
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
            <TextField
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
                input: {
                  inputRef,
                  sx: styles.textFieldInput(input),
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
                <Tooltip
                  title={tooltipOfSendButton}
                  placement="top"
                >
                  <Box component="span">
                    <IconButton
                      variant="icon"
                      disabled={disabledSend || !question}
                      onClick={onEnterDown}
                      aria-label="send your question"
                      sx={styles.sendButton(sendButton)}
                    >
                      <SendIcon sx={styles.sendIcon(sendButton)} />
                    </IconButton>
                  </Box>
                </Tooltip>

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
                  <IconButton
                    variant="icon"
                    color="secondary"
                    sx={styles.stopButton(stopButton)}
                    onClick={onStop}
                  >
                    <StopIcon style={styles.stopIconStyle} />
                  </IconButton>
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
const userInputStyles = (isFocused, isDragOver) => {
  const getInputBackground = palette => {
    if (!isFocused) return palette.background.card.default;

    return palette.mode === 'light' ? palette.background.secondary : palette.background.onboardingBody;
  };

  const getInputBorder = palette => {
    if (!isFocused) return 'transparent';

    return `linear-gradient(0deg, ${palette.background.userInputBorderDark} 0%, ${palette.background.userInputBorderLight} 100%)`;
  };

  return {
    gradientBorder: ({ palette }) => ({
      width: '100%',
      padding: '1px',
      borderRadius: '1rem',
      background: getInputBorder(palette),

      ...(isFocused && {
        boxShadow: `0px -5px 20px 0px ${palette.background.userInputBorderShadow}`,
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
        ? `2px dashed ${palette.primary.main}`
        : `1px solid ${isFocused ? 'transparent' : palette.border.lines}`,
      boxSizing: 'border-box',
      gap: '1.5rem',
      transition: 'all 0.2s ease-in-out',
      position: 'relative',
      ...(isDragOver && {
        boxShadow: `0 4px 12px ${palette.primary.main}30`,
      }),
    }),
    textFieldWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
    },
    textField: {
      padding: 0,
      flex: '1 0 0',
      fontSize: '.875rem',
      fontStyle: 'normal',
      fontWeight: 400,
      lineHeight: '1.375rem',
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
      gap: { xs: '.5rem', sm: '1rem' },
    },
    sendButtonContainer: {
      display: 'flex',
      height: 'auto',
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    }),
    sendIcon: sendButton => ({
      fontSize: '1.125rem',
      fill: sendButton?.iconColor ?? '#0E131D',
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
