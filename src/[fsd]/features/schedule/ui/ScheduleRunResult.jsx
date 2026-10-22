import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Link, Typography } from '@mui/material';

import RouteDefinitions from '@/routes';

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
          <Typography
            data-testid="schedule-run-summary"
            variant="bodyMedium"
          >
            {summary}
          </Typography>
        )}
        {run.conversation_id != null && (
          <Link
            component={RouterLink}
            to={`${RouteDefinitions.Chat}/${run.conversation_id}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="bodyMedium"
            sx={styles.link}
          >
            Open conversation
            <OpenInNewIcon sx={styles.linkIcon} />
          </Link>
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
  header: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  link: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' },
  linkIcon: { fontSize: '0.875rem' },
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
