import { memo } from 'react';

import { Box, Stepper } from '@mui/material';

import { FlowEditorConstants, TimeLineConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  getActiveRowPosition,
  isRowActive,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers/timeLine.helpers';
import { useTimeLineGroups } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import ProcessConnector from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/ProcessConnector';
import TimeLineHeader from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineHeader';
import TimeLineStep from '@/[fsd]/features/pipelines/flow-editor/ui/state/timeline/TimeLineStep';
import { customScrollbarSx } from '@/[fsd]/shared/lib/helpers';

const { PipelineStatus } = FlowEditorConstants;
const { STEP_CONNECTOR_MIN_WIDTH, STEP_MIN_WIDTH } = TimeLineConstants;

const TimeLine = memo(props => {
  const { steps, outerSteps, status, selectedStep, onSelect } = props;

  const { expandAll, hasGroups, visibleSteps, toggleGroup, toggleExpandAll } = useTimeLineGroups(
    steps,
    selectedStep,
    onSelect,
  );

  const styles = timeLineStyles();
  const isError = status === PipelineStatus.Error;
  const inProgressStep = steps.findIndex(step => step.status === PipelineStatus.InProgress);

  return (
    <>
      <TimeLineHeader
        steps={steps}
        outerSteps={outerSteps}
        status={status}
        selectedStep={selectedStep}
        hasGroups={hasGroups}
        expandAll={expandAll}
        onToggleExpandAll={toggleExpandAll}
      />
      <Box
        sx={[styles.scroll, customScrollbarSx]}
        role="region"
        aria-label="Pipeline timeline steps"
        tabIndex={0}
      >
        <Stepper
          sx={styles.stepper}
          activeStep={getActiveRowPosition(visibleSteps, inProgressStep)}
          connector={<ProcessConnector isError={isError} />}
        >
          {visibleSteps.map(({ index, end, expanded = false }) => (
            <TimeLineStep
              key={index}
              stepIndex={index}
              end={end}
              expanded={expanded}
              active={isRowActive(index, end, expanded, selectedStep)}
              step={steps[index]}
              isError={isError}
              onSelect={onSelect}
              onToggleGroup={toggleGroup}
            />
          ))}
        </Stepper>
      </Box>
    </>
  );
});

TimeLine.displayName = 'TimeLine';

/** @type {MuiSx} */
const timeLineStyles = () => ({
  scroll: ({ palette }) => ({
    flexShrink: 0,
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    borderBottom: `0.0625rem solid ${palette.components.flowEditor.node.border}`,
  }),
  stepper: {
    boxSizing: 'border-box',
    width: 'max-content',
    minWidth: '100%',
    // Top padding fits the name area (button height plus its offset).
    padding: '2rem 1.5rem 2.625rem',
    '& > .MuiStepConnector-root': {
      minWidth: STEP_CONNECTOR_MIN_WIDTH,
      '& .MuiStepConnector-line': {
        marginInline: `calc(${STEP_MIN_WIDTH} / -2)`,
      },
      '&:nth-child(2) .MuiStepConnector-line': {
        marginInlineStart: `calc(${STEP_MIN_WIDTH} / -4)`,
      },
      '&:nth-last-child(2) .MuiStepConnector-line': {
        marginInlineEnd: `calc(${STEP_MIN_WIDTH} / -4)`,
      },
    },
  },
});

export default TimeLine;
