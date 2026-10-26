import { memo, useCallback, useContext } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useNodeOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { Select } from '@/[fsd]/shared/ui';

const { PipelineNodeTypes } = FlowEditorConstants;

/**
 * Decision outputs as a multi-select. Adding an output goes through the canvas connect logic and removing one
 * through the chip removal, so the YAML and edges match what drawing or deleting the edge produces.
 */
const DecisionOutputsSelect = memo(props => {
  const { id, decisionOutput = [], onRemoveOutput, disabled } = props;
  const { onConnectNodes } = useContext(FlowEditorContext);
  // A decision can't point at another decision or condition, the same rule as drawing the edge
  const nodeFilter = useCallback(
    node =>
      node.id !== id && node.type !== PipelineNodeTypes.Decision && node.type !== PipelineNodeTypes.Condition,
    [id],
  );
  const nodeOptions = useNodeOptions(nodeFilter, true);

  const onValueChange = useCallback(
    newValue => {
      const nextOutputs = Array.isArray(newValue) ? newValue : [];
      nextOutputs
        .filter(target => !decisionOutput.includes(target))
        .forEach(target =>
          onConnectNodes?.({ source: id, sourceHandle: 'nodes', target, targetHandle: null }),
        );
      decisionOutput
        .filter(target => !nextOutputs.includes(target))
        .forEach(target => onRemoveOutput(target)());
    },
    [decisionOutput, id, onConnectNodes, onRemoveOutput],
  );

  return (
    <Select.SingleSelect
      label="Decision outputs"
      value={decisionOutput}
      onValueChange={onValueChange}
      options={nodeOptions}
      multiple
      disabled={disabled}
      showBorder
      className="nopan nodrag"
      data-testid="pipeline-decision-node-outputs-select"
    />
  );
});

DecisionOutputsSelect.displayName = 'DecisionOutputsSelect';

export default DecisionOutputsSelect;
