import { memo, useCallback, useState } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { VoiceConfigDialog } from '@/[fsd]/features/chat/voice-config';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlayIcon from '@/assets/play.svg?react';
import StopIcon from '@/assets/stop_record.svg?react';
import { VOICE_FEATURES_ENABLED, VOICE_FEATURES_TEMPORARILY_DISABLED } from '@/common/constants';
import SettingIcon from '@/components/Icons/SettingIcon';

const VoiceControlButton = memo(props => {
  const { onStop, voiceConfig, voices, onVoiceConfigChange, ttsModel, hasModelTTS, isPlaying, onPlay } =
    props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const styles = getStyles();

  const handleDialogOpen = useCallback(() => setDialogOpen(true), []);
  const handleDialogClose = useCallback(() => setDialogOpen(false), []);

  const handleApply = useCallback(
    config => {
      onVoiceConfigChange(config);
      setDialogOpen(false);
    },
    [onVoiceConfigChange],
  );

  if (!VOICE_FEATURES_ENABLED) return null;

  return (
    <>
      <Box
        variant="elitea"
        color="secondary"
        sx={styles.container}
      >
        <StyledTooltip
          title={
            VOICE_FEATURES_TEMPORARILY_DISABLED
              ? 'Voice features temporarily disabled'
              : isPlaying
                ? 'Stop speaking'
                : 'Start speaking'
          }
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              data-testid="chat-voice-play-stop-button"
              variant={BUTTON_VARIANTS.icon}
              color="tertiary"
              size="small"
              onClick={isPlaying ? onStop : onPlay}
              sx={styles.button}
            >
              {isPlaying ? <StopIcon sx={styles.icon} /> : <PlayIcon sx={styles.icon} />}
            </BaseBtn>
          </Box>
        </StyledTooltip>

        <StyledTooltip
          title="Voice settings"
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              data-testid="chat-voice-settings-button"
              variant={BUTTON_VARIANTS.tertiary}
              size="small"
              onClick={handleDialogOpen}
              aria-label="Voice settings"
              disabled={isPlaying}
              sx={styles.button}
            >
              <SettingIcon sx={styles.icon} />
            </BaseBtn>
          </Box>
        </StyledTooltip>
      </Box>
      <VoiceConfigDialog
        config={voiceConfig}
        voices={voices}
        open={dialogOpen}
        onApply={handleApply}
        onCancel={handleDialogClose}
        ttsModel={ttsModel}
        hasModelTTS={hasModelTTS}
        isPlaying
      />
    </>
  );
});

VoiceControlButton.displayName = 'VoiceControlButton';

export default VoiceControlButton;

/** @type {MuiSx} */
const getStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    flexShrink: 0,
    height: '100%',
    borderRadius: '1.625rem',
    padding: '0.5rem',
    gap: '0.5rem',
    boxShadow: ({ palette }) => `inset 0.0625rem 0 0 0 ${palette.border.lines}`,
    background: ({ palette }) => palette.background.tabPanel,
  },
  button: {
    '&.Mui-disabled path': {
      fill: ({ palette }) => palette.icon.fill.disabled,
    },
    color: ({ palette }) => `${palette.text.primary} !important`,
    minWidth: '1.75rem !important',
    minHeight: '1.75rem !important',
    maxWidth: '1.75rem !important',
    maxHeight: '1.75rem !important',
    borderRadius: '1.75rem',
    padding: '0 !important',
    '&:hover': {
      color: ({ palette }) => `${palette.text.secondary} !important`,
    },
  },
  icon: {
    fontSize: '1rem',
    width: '1rem',
    height: '1rem',
  },
});
