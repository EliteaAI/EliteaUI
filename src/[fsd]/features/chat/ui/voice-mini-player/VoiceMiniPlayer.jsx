import { memo } from 'react';

import { Box } from '@mui/material';

import MicphoneIcon from '@/assets/megaphone.svg?react';
import { VOICE_FEATURES_ENABLED } from '@/common/constants';

import { VoiceControlButton } from '../voice-control-button';

const VoiceMiniPlayer = memo(props => {
  const { onStop, voiceConfig, voices, onVoiceConfigChange, ttsModel, hasModelTTS } = props;
  const styles = getStyles();

  if (!VOICE_FEATURES_ENABLED) return null;

  return (
    <Box sx={styles.pill}>
      <MicphoneIcon sx={styles.icon} />
      <VoiceControlButton
        onStop={onStop}
        voiceConfig={voiceConfig}
        voices={voices}
        onVoiceConfigChange={onVoiceConfigChange}
        ttsModel={ttsModel}
        hasModelTTS={hasModelTTS}
      />
    </Box>
  );
});

VoiceMiniPlayer.displayName = 'VoiceMiniPlayer';

export default VoiceMiniPlayer;

/** @type {MuiSx} */
const getStyles = () => ({
  pill: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingLeft: '0.75rem',
    borderRadius: '1.625rem',
    height: '2.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    alignSelf: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    marginBottom: '1rem',
    marginTop: '1rem',
    background: palette.background.secondary,
  }),
  icon: {
    width: '1rem',
    height: '1rem',
  },
});
