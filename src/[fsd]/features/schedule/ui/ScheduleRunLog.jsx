import { Fragment, memo, useCallback, useLayoutEffect, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { formatRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';

import { toLogLevel } from '../lib/helpers';

const LOG_TIME_FORMAT = 'HH:mm:ss';
// Closer to the end than this counts as "at the newest line"
const FOLLOW_THRESHOLD_PX = 8;

/**
 * The live log of one run (owner CR 2026-10-21 test panel log): one line per server event.
 * `pausedAction` shows right under the last paused line; `emptyText` shows without events.
 */
const ScheduleRunLog = memo(props => {
  const { events, emptyText, pausedAction } = props;

  const boxRef = useRef(null);
  const following = useRef(true);
  const lastPausedIndex = events.findLastIndex(event => event.kind === 'paused');

  const handleScroll = useCallback(() => {
    const box = boxRef.current;
    following.current = box.scrollHeight - box.scrollTop - box.clientHeight <= FOLLOW_THRESHOLD_PX;
  }, []);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (following.current) box.scrollTop = box.scrollHeight;
  }, [events.length]);

  const styles = scheduleRunLogStyles();

  return (
    <Box
      ref={boxRef}
      data-testid="schedule-run-log"
      role="log"
      aria-live="polite"
      sx={styles.root}
      onScroll={handleScroll}
    >
      {!events.length && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {emptyText}
        </Typography>
      )}
      {events.map((event, index) => {
        const level = toLogLevel(event);
        return (
          <Fragment key={`${event.at}-${index}`}>
            <Box
              data-testid="schedule-run-log-line"
              data-level={level}
              sx={styles.line}
            >
              <Box
                component="span"
                data-testid="schedule-run-log-time"
                sx={styles.time}
              >
                {formatRunTimestamp(event.at, LOG_TIME_FORMAT)}
              </Box>
              <Box
                component="span"
                data-testid="schedule-run-log-text"
                sx={styles.text[level] ?? styles.text.info}
              >
                {event.text}
              </Box>
            </Box>
            {index === lastPausedIndex && pausedAction}
          </Fragment>
        );
      })}
    </Box>
  );
});

ScheduleRunLog.displayName = 'ScheduleRunLog';

/** @type {MuiSx} */
const scheduleRunLogStyles = () => ({
  // 16 lines of 1.375 rem (or 40 % of the window height), then it scrolls inside
  root: ({ palette }) => ({
    maxHeight: 'min(22rem, 40dvh)',
    overflowY: 'auto',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
  }),
  line: {
    display: 'grid',
    gridTemplateColumns: '5.5rem 1fr',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    lineHeight: '1.375rem',
  },
  time: ({ palette }) => ({ color: palette.text.secondary }),
  text: {
    info: ({ palette }) => ({ color: palette.text.primary, wordBreak: 'break-word' }),
    warning: ({ palette }) => ({ color: palette.alert.warning.text, wordBreak: 'break-word' }),
    success: ({ palette }) => ({ color: palette.alert.success.text, wordBreak: 'break-word' }),
    error: ({ palette }) => ({ color: palette.alert.error.text, wordBreak: 'break-word' }),
  },
});

export default ScheduleRunLog;
