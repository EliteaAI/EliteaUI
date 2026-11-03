import { memo, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Link, Typography } from '@mui/material';

import { buildScheduleHistoryLink } from '@/[fsd]/entities/schedule';
import { TextLinkConstants } from '@/[fsd]/shared/lib/constants';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';

import { isRunActive, toPlainText } from '../lib/helpers';
import { useRunDetail, useScheduleRunConversation } from '../lib/hooks/useScheduleRuns.hooks';
import ScheduleRunLog from './ScheduleRunLog';
import ScheduleWaitingCard from './ScheduleWaitingCard';

const NO_EVENTS = [];
const NO_SCHEDULE_ID = null;
// The raw error of a tool stays in the run log; the response of a failed run is a short, plain line
const FAILED_RESPONSE = 'The run did not finish. Open the run logs for details.';

// What a run shows once it is open, by status: the waiting run asks for a decision, a running run shows its
// log, an ended run shows the response, and every ended run can open its log and the Run History.
const ScheduleRunDetail = memo(props => {
  const { run, schedule, entityType, applicationId } = props;

  const { run: detail, isError, refetch } = useRunDetail(schedule?.id, applicationId, run);
  const shown = detail ?? run;
  const conversation = useScheduleRunConversation(shown);
  const events = detail?.events ?? NO_EVENTS;
  const active = isRunActive(shown.status);
  const [logOpen, setLogOpen] = useState(false);
  const styles = scheduleRunDetailStyles();

  if (shown.status === 'waiting_for_approval' && schedule)
    return (
      <ScheduleWaitingCard
        schedule={schedule}
        run={shown}
      />
    );

  const response = shown.status === 'failed' ? FAILED_RESPONSE : toPlainText(conversation.answer);
  const showLog = active || logOpen;
  // A Test run of the form sits on a hidden draft, so its link filters by the Test trigger, not by a schedule
  const link = buildScheduleHistoryLink(
    {
      id: run.isDraftRun ? NO_SCHEDULE_ID : (schedule?.id ?? NO_SCHEDULE_ID),
      entity_type: entityType,
      application_id: applicationId,
    },
    run.isDraftRun ? { trigger_type: 'test' } : undefined,
  );

  return (
    <Box
      data-testid="schedule-run-detail"
      sx={styles.root}
    >
      {isError && (
        <BannerMessage variant="error">
          <Typography variant="bodySmall">
            Failed to load the run.{' '}
            <Link
              component="button"
              type="button"
              variant="bodySmall"
              onClick={refetch}
            >
              Retry
            </Link>
          </Typography>
        </BannerMessage>
      )}
      {shown.reason && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="schedule-run-reason"
        >
          {shown.reason}
        </Typography>
      )}
      {!active && (
        <Box sx={styles.section}>
          <Typography
            variant="labelSmall"
            color="text.secondary"
          >
            RESPONSE
          </Typography>
          <Typography
            data-testid="schedule-run-answer"
            variant="bodyMedium"
            color="text.primary"
            sx={styles.answer}
          >
            {response || 'No response.'}
          </Typography>
        </Box>
      )}
      {!active && (
        <Link
          component="button"
          type="button"
          variant="bodySmall"
          aria-expanded={logOpen}
          onClick={() => setLogOpen(open => !open)}
          underline="none"
          sx={styles.toggle}
        >
          <ChevronRightIcon
            fontSize="small"
            sx={styles.toggleIcon(logOpen)}
          />
          {logOpen ? 'Hide run logs' : 'Run logs'}
        </Link>
      )}
      {showLog && (
        <ScheduleRunLog
          key={shown.id}
          events={events}
          emptyText={active ? 'No log lines yet.' : 'No log lines.'}
        />
      )}
      <Link
        component={RouterLink}
        to={link}
        variant="bodySmall"
        underline="none"
        sx={[TextLinkConstants.TEXT_LINK_SX, styles.history]}
        data-testid="schedule-run-open-history"
      >
        Open in Run History
      </Link>
    </Box>
  );
});

ScheduleRunDetail.displayName = 'ScheduleRunDetail';

/** @type {MuiSx} */
const scheduleRunDetailStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 1rem 1rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  answer: { whiteSpace: 'pre-line' },
  toggle: ({ palette }) => ({
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: palette.text.secondary,
  }),
  toggleIcon: open => ({ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }),
  history: { alignSelf: 'flex-start', textDecoration: 'none' },
});

export default ScheduleRunDetail;
