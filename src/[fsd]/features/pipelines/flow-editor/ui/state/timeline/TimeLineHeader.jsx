import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import TimeLineExpandAllSwitch from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineExpandAllSwitch';
import TimeLineRunStatus from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineRunStatus';

const { PipelineStatus } = FlowEditorConstants;

const TimeLineHeader = memo(props => {
  const { steps, outerSteps, status, selectedStep, hasGroups, expandAll, onToggleExpandAll } = props;

  const styles = timeLineHeaderStyles();
  const showRunStatus =
    status === PipelineStatus.InProgress ||
    status === PipelineStatus.Error ||
    status === PipelineStatus.Interrupt;

  return (
    <Box
      sx={styles.header}
      data-testid="pipeline-run-details-timeline-section"
    >
      <Box sx={styles.currentStep}>
        <Typography
          variant="subtitle"
          color="text.primary"
        >
          Timeline step:
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          {status === PipelineStatus.InProgress ? outerSteps.at(-2)?.id || 'Start' : steps[selectedStep]?.id}
        </Typography>
      </Box>
      <Box sx={styles.actions}>
        {hasGroups && (
          <TimeLineExpandAllSwitch
            checked={expandAll}
            onChange={onToggleExpandAll}
          />
        )}
        {showRunStatus && <TimeLineRunStatus lastStep={outerSteps.at(-1)} />}
      </Box>
    </Box>
  );
});

TimeLineHeader.displayName = 'TimeLineHeader';

/** @type {MuiSx} */
const timeLineHeaderStyles = () => ({
  header: {
    display: 'flex',
    width: '100%',
    height: '2.25rem',
    justifyContent: 'space-between',
    padding: '0.5rem 1.5rem 0 1.5rem',
  },
  currentStep: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
});

export default TimeLineHeader;
