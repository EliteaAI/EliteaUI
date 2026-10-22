import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { formatRunSummary, toPlainText } from '../lib/helpers';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

// The result card of an ended run (owner CR 2026-10-21 test panel log); `answer` is the last agent message
const ScheduleRunResult = memo(props => {
  const { run, answer } = props;

  const summary = formatRunSummary(run.summary);
  const text = toPlainText(answer);
  const styles = scheduleRunResultStyles();

  return (
    <Box
      data-testid="schedule-run-result"
      sx={styles.root}
    >
      <Box sx={styles.header}>
        <ScheduleRunStatusChip status={run.status} />
        {summary && (
          <Tooltip
            title={summary}
            placement="top"
          >
            <Typography
              data-testid="schedule-run-summary"
              variant="bodyMedium"
              sx={styles.summary}
            >
              {summary}
            </Typography>
          </Tooltip>
        )}
      </Box>
      {run.reason && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          {run.reason}
        </Typography>
      )}
      {text && (
        <Typography
          data-testid="schedule-run-answer"
          variant="bodyMedium"
          sx={styles.answer}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
});

ScheduleRunResult.displayName = 'ScheduleRunResult';

/** @type {MuiSx} */
const scheduleRunResultStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  // CR-21 fit spec: one row, so the card stays 88 px; the stats shrink with an ellipsis, the chip does not
  header: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: '0.75rem',
    '& > :first-child': { flexShrink: 0 },
  },
  summary: {
    flex: '0 1 auto',
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  // CR-21 option A: 2 answer lines under a 1000 px window height, so the card fits the right block
  answer: {
    whiteSpace: 'pre-line',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '4',
    overflow: 'hidden',
    '@media (max-height: 62.4375rem)': { WebkitLineClamp: '2' },
  },
});

export default ScheduleRunResult;
