import { memo, useCallback, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import PauseIcon from '@/assets/pause-icon.svg?react';
import { ChatParticipantType } from '@/common/constants';

const NARROW_WIDTH_THRESHOLD = 320;

const ChatStatusPill = memo(props => {
  const { isRunning = false, isInterrupt = false, participantType, agentType } = props;

  const [isNarrow, setIsNarrow] = useState(false);
  const observerRef = useRef(null);

  const containerRef = useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    const el = node?.parentElement;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < NARROW_WIDTH_THRESHOLD);
      }
    });
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  const styles = chatStatusPillStyles(isInterrupt);

  if (
    participantType !== ChatParticipantType.Applications &&
    participantType !== ChatParticipantType.Pipelines
  )
    return null;
  if (!isRunning && !isInterrupt) return null;

  const entityLabel =
    participantType === ChatParticipantType.Pipelines || agentType === 'pipeline' ? 'Pipeline' : 'Agent';
  const label = isInterrupt
    ? isNarrow
      ? 'Waiting for your input...'
      : `${entityLabel} paused — waiting for your input...`
    : `${entityLabel} is running...`;

  return (
    <Box
      ref={containerRef}
      sx={styles.pill}
    >
      <Box sx={styles.iconWrap}>
        {isInterrupt ? (
          <PauseIcon />
        ) : (
          <CircularProgress
            size={16}
            thickness={5}
            sx={styles.spinner}
          />
        )}
      </Box>
      <Typography
        variant="bodySmall2"
        sx={styles.label}
      >
        {label}
      </Typography>
    </Box>
  );
});

ChatStatusPill.displayName = 'ChatStatusPill';

/** @type {MuiSx} */
const chatStatusPillStyles = isInterrupt => ({
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    px: '0.75rem',
    py: '0.5rem',
    borderRadius: '1.25rem',
    backgroundColor: ({ palette }) => `${palette.primary.main}1A`,
    alignSelf: 'center',
    flexShrink: 0,
    maxWidth: '100%',
    minWidth: 0,
  },
  iconWrap: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '1.0625rem',
    backgroundColor: `${palette.primary.main}1A`,
    flexShrink: 0,
    color: palette.primary.main,
    ...(isInterrupt && {
      animation: 'iconWave 1.6s ease-out infinite',
      '@keyframes iconWave': {
        '0%': { boxShadow: `0 0 0 0 ${palette.primary.main}4D` },
        '70%': { boxShadow: `0 0 0 0.5rem ${palette.primary.main}00` },
        '100%': { boxShadow: `0 0 0 0 ${palette.primary.main}00` },
      },
    }),
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
  spinner: ({ palette }) => ({
    color: palette.primary.main,
  }),
  label: ({ palette }) => ({
    color: palette.primary.main,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  }),
});

export default ChatStatusPill;
