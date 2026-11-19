import { memo, useCallback } from 'react';

import { Step } from '@mui/material';

import { TimeLineConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import ProcessStepIcon from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/ProcessStepIcon';
import TimeLineStepLabel from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineStepLabel';
import TimeLineStepName from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineStepName';

const { STEP_MIN_WIDTH } = TimeLineConstants;

const TimeLineStep = memo(props => {
  // `position` and `last` are injected by Stepper and must reach Step, which uses them for connectors
  // and the active-step state. `row.index` is the step's own index in `steps`, which differs once
  // groups are collapsed.
  const { index: position, last, row, steps, selectedStep, isError, onSelect, onToggleGroup } = props;
  const { index, end, expanded } = row;

  const styles = timeLineStepStyles();
  const step = steps[index];
  const hasGroup = end > index;
  const groupLabel = step.group_label || step.id;
  const stepCount = end - index + 1;
  const toggleLabel = `${expanded ? 'Collapse' : 'Expand'} ${groupLabel} (${stepCount} steps)`;

  const handleToggle = useCallback(() => {
    onToggleGroup(index, end, expanded);
  }, [end, expanded, index, onToggleGroup]);

  return (
    <Step
      index={position}
      last={last}
      sx={styles.step}
    >
      <TimeLineStepName
        index={index}
        name={hasGroup && !expanded ? groupLabel : step.id}
        groupLabel={groupLabel}
        stepCount={hasGroup && !expanded ? stepCount : undefined}
        hasGroup={hasGroup}
        expanded={expanded}
        toggleLabel={toggleLabel}
        onToggle={handleToggle}
      />
      <ProcessStepIcon
        onSelect={onSelect}
        index={index}
        active={index === selectedStep || (!expanded && index < selectedStep && selectedStep <= end)}
        isError={isError}
      />
      <TimeLineStepLabel
        index={index}
        createdAt={step.created_at}
      />
    </Step>
  );
});

TimeLineStep.displayName = 'TimeLineStep';

/** @type {MuiSx} */
const timeLineStepStyles = () => ({
  step: {
    minWidth: STEP_MIN_WIDTH,
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 !important',
    position: 'relative',
    '&:first-child, &:nth-last-child(2)': {
      minWidth: `calc(${STEP_MIN_WIDTH} / 2)`,
    },
  },
});

export default TimeLineStep;
