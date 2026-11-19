import { memo, useCallback } from 'react';

import { Step } from '@mui/material';

import { TimeLineConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import ProcessStepIcon from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/ProcessStepIcon';
import TimeLineStepLabel from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineStepLabel';
import TimeLineStepName from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineStepName';

const { STEP_MIN_WIDTH } = TimeLineConstants;

const TimeLineStep = memo(props => {
  // Stepper injects `index` (the row's position) and `last`, and Step needs both for its connectors and
  // active state. The step's own index in `steps` differs once groups are collapsed, so it has another name.
  // Only `id`, `group_label` and `created_at` are read from `step`. They never change after the step is
  // created, so the object can be passed as is although the parser updates its status and state in place.
  const {
    index: position,
    last,
    stepIndex,
    end,
    expanded,
    active,
    step,
    isError,
    onSelect,
    onToggleGroup,
  } = props;

  const styles = timeLineStepStyles();
  const hasGroup = end > stepIndex;
  const groupLabel = step.group_label || step.id;
  const stepCount = end - stepIndex + 1;
  const toggleLabel = `${expanded ? 'Collapse' : 'Expand'} ${groupLabel} (${stepCount} steps)`;

  const handleToggle = useCallback(() => {
    onToggleGroup(stepIndex, end, expanded);
  }, [end, expanded, stepIndex, onToggleGroup]);

  return (
    <Step
      index={position}
      last={last}
      sx={styles.step}
    >
      <TimeLineStepName
        index={stepIndex}
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
        index={stepIndex}
        active={active}
        isError={isError}
      />
      <TimeLineStepLabel
        index={stepIndex}
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
    '&:first-child, &:last-child': {
      minWidth: `calc(${STEP_MIN_WIDTH} / 2)`,
    },
  },
});

export default TimeLineStep;
