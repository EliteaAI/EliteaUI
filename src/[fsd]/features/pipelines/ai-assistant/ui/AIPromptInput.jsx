import { memo, useEffect, useRef, useState } from 'react';

import { Box, IconButton, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import AIMagicIconDark from '@/assets/ai-magic-icon-dark.svg?react';
import AIMagicIconLight from '@/assets/ai-magic-icon-light.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import { ChatInputContainer, StyledTextField } from '@/components/Chat/StyledComponents';
import SendIcon from '@/components/Icons/SendIcon';

const AIPromptInput = memo(props => {
  const { disabled = false, onGenerate, onStop, isLoading = false, promptValueRef } = props;

  const theme = useTheme();
  const styles = aiPromptInputStyles();

  const [aiPrompt, setAiPrompt] = useState('');
  const inputRef = useRef(null);

  const AIMagicIcon = theme.palette.mode === 'light' ? AIMagicIconLight : AIMagicIconDark;

  // Expose clear method via ref
  useEffect(() => {
    if (promptValueRef) {
      promptValueRef.current = {
        clear: () => setAiPrompt(''),
        getValue: () => aiPrompt,
        setValue: value => setAiPrompt(value),
        focus: () => inputRef.current?.focus(),
      };
    }
  }, [promptValueRef, aiPrompt]);

  const handleAIPromptChange = event => {
    setAiPrompt(event.target.value);
  };

  const handleSendAIPrompt = async () => {
    if (!aiPrompt.trim() || isLoading) return;

    try {
      await onGenerate?.(aiPrompt);
      // Don't clear immediately - let parent decide via ref
    } catch {
      // Keep prompt on error for retry
    }
  };

  const handleStop = () => {
    onStop?.();
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendAIPrompt();
    }
  };

  return (
    <ChatInputContainer sx={styles.container}>
      <Box sx={styles.iconContainer}>
        <AIMagicIcon sx={styles.aiIcon} />
      </Box>
      <StyledTextField
        fullWidth
        multiline
        maxRows={4}
        placeholder="Describe your idea to generate or rewrite the value."
        value={aiPrompt}
        onChange={handleAIPromptChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading || disabled}
        variant="standard"
        inputRef={inputRef}
        slotProps={{
          input: {
            disableUnderline: true,
            sx: styles.input,
          },
        }}
        sx={styles.textField}
      />
      {isLoading ? (
        <StyledTooltip
          title="Stop"
          placement="top"
        >
          <IconButton
            variant="icon"
            onClick={handleStop}
            sx={styles.stopButton}
          >
            <StopIcon sx={styles.stopIcon} />
          </IconButton>
        </StyledTooltip>
      ) : (
        <StyledTooltip
          title="Send"
          placement="top"
        >
          <Box
            component="span"
            sx={styles.buttonWrapper}
          >
            <IconButton
              variant="icon"
              onClick={handleSendAIPrompt}
              disabled={!aiPrompt.trim() || disabled}
              sx={styles.sendButton}
            >
              <SendIcon sx={styles.sendIcon} />
            </IconButton>
          </Box>
        </StyledTooltip>
      )}
    </ChatInputContainer>
  );
});

AIPromptInput.displayName = 'AIPromptInput';

/** @type {MuiSx} */
const aiPromptInputStyles = () => ({
  container: ({ palette, spacing }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '1rem',
    padding: spacing(1.5, 1.75),
    background: palette.background.default,
    display: 'flex',
    alignItems: 'center',
    gap: spacing(2),
    '&:focus-within': {
      borderColor: palette.primary.pressed,
    },
  }),
  iconContainer: ({ palette, spacing }) => ({
    position: 'relative',
    width: spacing(4.5),
    height: spacing(4.5),
    borderRadius: '0.75rem',
    background: palette.aiAssistant.iconBackground,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: '0.75rem',
      padding: '0.0625rem',
      background: palette.aiAssistant.iconBorder,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      maskComposite: 'exclude',
    },
  }),
  aiIcon: {
    fontSize: '1rem',
  },
  input: ({ palette, typography }) => ({
    color: palette.text.primary,
    ...typography.bodyMedium,
    padding: 0,
    '& textarea': {
      padding: 0,
    },
  }),
  textField: {
    '& .MuiInputBase-root': {
      padding: 0,
    },
  },
  buttonWrapper: {
    display: 'inline-block',
  },
  sendButton: ({ palette, spacing }) => ({
    height: spacing(3.5),
    width: spacing(3.5),
    borderRadius: '50%',
    backgroundColor: palette.primary.main,
    '&.Mui-disabled': {
      backgroundColor: palette.background.button.primary.disabled,
    },
    '&:hover': {
      backgroundColor: palette.primary.main,
    },
  }),
  stopButton: ({ palette, spacing }) => ({
    height: spacing(3.5),
    width: spacing(3.5),
    borderRadius: '50%',
    backgroundColor: palette.background.button.secondary.default,
    color: `${palette.status.onModeration} !important`,
    '& svg': {
      color: `${palette.status.onModeration} !important`,
      fill: `${palette.status.onModeration} !important`,
    },
    '&.Mui-disabled': {
      backgroundColor: palette.background.button.primary.disabled,
    },
    '&:hover': {
      backgroundColor: palette.background.button.secondary.hover,
    },
  }),
  sendIcon: ({ palette }) => ({
    fontSize: '1rem',
    fill: palette.icon.fill.send,
  }),
  stopIcon: {
    fontSize: '1rem',
    color: 'inherit',
  },
});

export default AIPromptInput;
