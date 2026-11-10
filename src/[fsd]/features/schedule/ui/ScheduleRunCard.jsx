import { memo } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, ButtonBase, Chip, Typography, alpha } from '@mui/material';

import { isWebhookRow } from '@/[fsd]/entities/schedule';

import { describeRunFacts, formatRunStarted, toTriggerLabel } from '../lib/helpers';
import ScheduleRunDetail from './ScheduleRunDetail';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

// One run of the Runs card: the compact line always, the detail only while the card is open
const ScheduleRunCard = memo(props => {
  const { run, isLatest, expanded, versionNames, schedule, entityType, applicationId, onToggle, onRunAgain } =
    props;

  const facts = describeRunFacts({
    ...run,
    version_label: run.version_label ?? versionNames[run.version_id],
  });
  const styles = scheduleRunCardStyles(expanded, isLatest);

  return (
    <Box
      component="li"
      data-testid="schedule-run-card"
      data-run-id={run.id}
      sx={styles.root}
    >
      <ButtonBase
        aria-expanded={expanded}
        sx={styles.header}
        onClick={() => onToggle(run.id)}
      >
        {isLatest && (
          <Chip
            data-testid="schedule-run-latest"
            size="small"
            label="LATEST"
            sx={styles.latest}
          />
        )}
        <Box sx={styles.line}>
          <Typography
            data-testid="schedule-run-started"
            variant="bodyMedium"
            noWrap
            sx={styles.started}
            title={new Date(run.started_at).toLocaleString()}
          >
            {formatRunStarted(run.started_at)}
          </Typography>
          <Chip
            data-testid="schedule-run-trigger"
            size="small"
            label={toTriggerLabel(run.trigger, isWebhookRow(schedule))}
            sx={styles.trigger}
          />
          <Box sx={styles.status}>
            <ScheduleRunStatusChip status={run.status} />
          </Box>
          <ExpandMoreIcon
            fontSize="small"
            sx={styles.chevron}
          />
        </Box>
        <Typography
          data-testid="schedule-run-facts"
          variant="bodySmall"
          color="text.primary"
          noWrap
        >
          {facts}
        </Typography>
      </ButtonBase>
      {expanded && (
        <ScheduleRunDetail
          run={run}
          schedule={schedule}
          entityType={entityType}
          applicationId={applicationId}
          onRunAgain={onRunAgain}
        />
      )}
    </Box>
  );
});

ScheduleRunCard.displayName = 'ScheduleRunCard';

/** @type {MuiSx} */
const scheduleRunCardStyles = (expanded, isLatest) => ({
  root: ({ palette }) => ({
    listStyle: 'none',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${expanded && isLatest ? alpha(palette.primary.main, 0.35) : palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
    width: '100%',
    padding: '0.75rem 1.25rem',
    textAlign: 'left',
    '&:focus-visible': { outline: '0.125rem solid currentColor', outlineOffset: '-0.125rem' },
  },
  line: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  // In this theme text.secondary is the bright tone and text.primary the muted one, as in the mockups
  started: ({ palette }) => ({ fontWeight: 600, color: palette.text.secondary }),
  status: { marginLeft: 'auto' },
  chevron: { transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' },
  latest: ({ palette }) => ({
    alignSelf: 'flex-start',
    height: '1.25rem',
    fontSize: '0.6875rem',
    color: palette.primary.main,
    backgroundColor: alpha(palette.primary.main, 0.1),
  }),
  trigger: ({ palette }) => ({
    color: palette.text.subtle,
    backgroundColor: palette.background.surface.interactive.active,
  }),
});

export default ScheduleRunCard;
