import { memo } from 'react';

import { Box } from '@mui/material';

import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import MicphoneIcon from '@/assets/megaphone.svg?react';
import PlayIcon from '@/assets/play_record.svg?react';
import PauseIcon from '@/assets/stop_record.svg?react';

const VoiceMiniPlayer = memo(props => {
  const { isPlaying, isPaused, onPause, onResume } = props;
  const styles = getStyles();

  if (!isPlaying && !isPaused) return null;

  return (
    <Box sx={styles.pill}>
      <MicphoneIcon sx={styles.icon} />
      {isPaused ? (
        <BaseBtn
          variant="icon"
          size="small"
          onClick={onResume}
          aria-label="Resume speaking"
        >
          <PlayIcon sx={styles.icon} />
        </BaseBtn>
      ) : (
        <BaseBtn
          variant="icon"
          size="small"
          onClick={onPause}
          aria-label="Pause speaking"
        >
          <PauseIcon sx={styles.icon} />
        </BaseBtn>
      )}
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
