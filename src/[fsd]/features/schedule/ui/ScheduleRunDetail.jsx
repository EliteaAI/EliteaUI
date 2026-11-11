import { memo, useEffect, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Link, Typography } from '@mui/material';

import { TOOLKIT_INDEX_TYPE, buildScheduleHistoryLink } from '@/[fsd]/entities/schedule';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';

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
  const { run, schedule, entityType, applicationId, indexName, onRunAgain } = props;

  const { run: detail, isError, refetch } = useRunDetail(schedule?.id, applicationId, run, indexName);
  const shown = detail ?? run;
  const conversation = useScheduleRunConversation(shown);
  const isIndexRun = entityType === TOOLKIT_INDEX_TYPE;
  const events = detail?.events ?? NO_EVENTS;
  const active = isRunActive(shown.status);
  const failed = shown.status === 'failed';
  // A run that fails while its card is open opens its log too, as the log explains the error
  const [logOpen, setLogOpen] = useState(failed);
  useEffect(() => {
    if (failed) setLogOpen(true);
  }, [failed]);
  const styles = scheduleRunDetailStyles();

  if (shown.status === 'waiting_for_approval' && (schedule || run.isDraftRun))
    return (
      <ScheduleWaitingCard
        schedule={schedule}
        run={run}
        entityType={entityType}
        applicationId={applicationId}
      />
    );

  const response = toPlainText(conversation.answer);
  const showLog = active || logOpen;
  // A Test run of the form has no schedule row, so its link filters by the Test trigger, not by a schedule
  const link = buildScheduleHistoryLink(
    {
      id: run.isDraftRun ? NO_SCHEDULE_ID : (schedule?.id ?? NO_SCHEDULE_ID),
      entity_type: entityType,
      application_id: applicationId,
      toolkit_id: applicationId,
      index_name: indexName,
    },
    run.isDraftRun ? { trigger: 'test' } : undefined,
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
      {failed && (
        <BannerMessage
          variant="error"
          message={shown.reason || FAILED_RESPONSE}
        />
      )}
      {shown.reason && !failed && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="schedule-run-reason"
        >
          {shown.reason}
        </Typography>
      )}
      {/* An index run has no chat: its details are in the index Run History */}
      {!active && !failed && !isIndexRun && (
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
      <Box sx={styles.footer}>
        <BaseBtn
          component={RouterLink}
          to={link}
          variant={BUTTON_VARIANTS.secondary}
          sx={styles.historyButton}
          data-testid="schedule-run-open-history"
        >
          Open in Run History
        </BaseBtn>
        {failed && onRunAgain && (
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            data-testid="schedule-run-again"
            onClick={onRunAgain}
          >
            Run again
          </BaseBtn>
        )}
      </Box>
    </Box>
  );
});

ScheduleRunDetail.displayName = 'ScheduleRunDetail';

/** @type {MuiSx} */
const scheduleRunDetailStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 1.25rem 1.25rem' },
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
  historyButton: { padding: '0 0.75rem' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' },
});

export default ScheduleRunDetail;
