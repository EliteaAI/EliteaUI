import { memo } from 'react';

import { Box } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import MicphoneIcon from '@/assets/megaphone.svg?react';
import StopIcon from '@/assets/stop_record.svg?react';
import { VOICE_FEATURES_ENABLED } from '@/common/constants';

const VoiceMiniPlayer = memo(props => {
  const { isPlaying, onStop } = props;
  const styles = getStyles();

  if (!VOICE_FEATURES_ENABLED) return null;
  if (!isPlaying) return null;

  return (
    <Box sx={styles.pill}>
      <MicphoneIcon sx={styles.icon} />
      <BaseBtn
        variant="icon"
        size="small"
        onClick={onStop}
        aria-label="Stop speaking"
      >
        <StopIcon sx={styles.icon} />
      </BaseBtn>
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
    px: '0.75rem',
    py: '0.5rem',
    borderRadius: '1.625rem',
    height: '2.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    alignSelf: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    marginBottom: '0.5rem',
    marginTop: '0.5rem',
  }),
  icon: {
    width: '1rem',
    height: '1rem',
  },
});
