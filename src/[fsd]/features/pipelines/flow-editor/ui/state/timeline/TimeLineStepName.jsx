import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { TimeLineConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { formatBadgeCount } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/timeLine.helpers';
import TimeLineGroupToggle from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineGroupToggle';
import { Chip, Text } from '@/[fsd]/shared/ui';

const { MAX_BADGE_COUNT, STEP_NAME_EDGE_MAX_WIDTH, STEP_NAME_HEIGHT, STEP_NAME_MAX_WIDTH } =
  TimeLineConstants;

const TimeLineStepName = memo(props => {
  const { index, name, groupLabel, stepCount, hasGroup, expanded, toggleLabel, onToggle } = props;

  const styles = timeLineStepNameStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.nameWithCount}>
        <Text.EllipsisTypography sx={styles.name}>{name}</Text.EllipsisTypography>
        {stepCount !== undefined && (
          <Tooltip title={stepCount > MAX_BADGE_COUNT ? `${stepCount} steps` : ''}>
            <Box sx={styles.countBadge}>
              <Chip.CountBadge
                count={formatBadgeCount(stepCount)}
                ariaLabel={`${stepCount} steps in ${groupLabel}`}
                testId={`pipeline-run-details-timeline-group-count-${index}`}
                sx={styles.countBadgeChip}
              />
            </Box>
          </Tooltip>
        )}
      </Box>
      {hasGroup && (
        <TimeLineGroupToggle
          label={toggleLabel}
          expanded={expanded}
          onToggle={onToggle}
        />
      )}
    </Box>
  );
});

TimeLineStepName.displayName = 'TimeLineStepName';

/** @type {MuiSx} */
const timeLineStepNameStyles = () => ({
  container: {
    position: 'absolute',
    bottom: 'calc(100% + 0.125rem)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
    minHeight: STEP_NAME_HEIGHT,
    width: 'max-content',
    maxWidth: STEP_NAME_MAX_WIDTH,
    '.MuiStep-root:first-child > &, .MuiStep-root:nth-last-child(2) > &': {
      maxWidth: STEP_NAME_EDGE_MAX_WIDTH,
    },
  },
  // The badge follows the name in the flow, raised to its top-right corner, so the name truncates
  // before it and the two never overlap.
  nameWithCount: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.125rem',
    minWidth: 0,
  },
  name: {
    width: 'auto',
    minWidth: 0,
    marginRight: 0,
    textAlign: 'center',
  },
  // The badge never shrinks, so a long name truncates before it does.
  countBadge: {
    display: 'flex',
    flexShrink: 0,
    marginTop: '-0.375rem',
  },
  countBadgeChip: {
    padding: '0 0.25rem',
    minWidth: '1rem',
  },
});

export default TimeLineStepName;
