import { memo } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, ButtonBase, Chip, Typography } from '@mui/material';

import { describeRunFacts, formatRunStarted, toTriggerLabel } from '../lib/helpers';
import ScheduleRunDetail from './ScheduleRunDetail';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

// One run of the Runs card: the compact line always, the detail only while the card is open
const ScheduleRunCard = memo(props => {
  const { run, isLatest, expanded, versionNames, schedule, entityType, applicationId, onToggle } = props;

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
        <Box sx={styles.line}>
          {isLatest && (
            <Chip
              data-testid="schedule-run-latest"
              size="small"
              label="LATEST"
              sx={styles.latest}
            />
          )}
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
            variant="outlined"
            label={toTriggerLabel(run.trigger)}
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
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${expanded && isLatest ? palette.secondary.main : palette.border.lines}`,
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.25rem',
    width: '100%',
    padding: '0.625rem 1rem',
    textAlign: 'left',
    '&:focus-visible': { outline: '0.125rem solid currentColor', outlineOffset: '-0.125rem' },
  },
  line: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  started: { fontWeight: 600 },
  status: { marginLeft: 'auto' },
  chevron: { transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' },
  latest: ({ palette }) => ({
    height: '1.25rem',
    fontSize: '0.6875rem',
    color: palette.text.secondary,
    backgroundColor: palette.background.default.secondary,
  }),
  trigger: ({ palette }) => ({ color: palette.text.secondary, borderColor: palette.border.lines }),
});

export default ScheduleRunCard;
