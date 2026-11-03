import { memo } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, ButtonBase, Chip, Typography } from '@mui/material';

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
            label={toTriggerLabel(run.trigger)}
            sx={styles.trigger}
          />
          <Box sx={styles.status}>
            <ScheduleRunStatusChip
              status={run.status}
              variant="card"
            />
          </Box>
          <ExpandMoreIcon
            fontSize="small"
            sx={styles.chevron}
          />
        </Box>
        <Typography
          data-testid="schedule-run-facts"
          variant="bodySmall"
          color="text.secondary"
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
    border: `0.0625rem solid ${expanded && isLatest ? palette.secondary.main : palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.375rem',
    width: '100%',
    padding: '1rem',
    textAlign: 'left',
    '&:focus-visible': { outline: '0.125rem solid currentColor', outlineOffset: '-0.125rem' },
  },
  line: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  started: ({ palette }) => ({ fontWeight: 600, color: palette.text.primary }),
  status: { marginLeft: 'auto' },
  chevron: { transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' },
  latest: ({ palette }) => ({
    alignSelf: 'flex-start',
    height: '1.25rem',
    fontSize: '0.6875rem',
    color: palette.secondary.main,
  }),
  trigger: ({ palette }) => ({ color: palette.text.secondary }),
});

export default ScheduleRunCard;
