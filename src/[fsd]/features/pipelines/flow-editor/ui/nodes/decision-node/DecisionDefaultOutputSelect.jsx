import { memo, useCallback, useContext } from 'react';

import {
  FlowEditorConstants,
  NodeFieldInfoConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers, NodeFieldInfoHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { Select } from '@/[fsd]/shared/ui';

const { PipelineNodeTypes, DEFAULT_OUTPUT } = FlowEditorConstants;

const DEFAULT_OUTPUT_INFO = NodeFieldInfoHelpers.getNodeFieldInfo(
  PipelineNodeTypes.Decision,
  NodeFieldInfoConstants.NODE_FIELD_KEYS.defaultOutput,
);

const isDefaultOutputEdge = id => edge => edge.source === id && edge.sourceHandle === DEFAULT_OUTPUT;

/**
 * The decision's default output. Picking a node replaces the default-output edge through the canvas connect
 * logic; clearing it does what deleting that edge does (`default_output: ''`).
 */
const DecisionDefaultOutputSelect = memo(props => {
  const { id, value = '', disabled } = props;
  const { onConnectNodes, setFlowEdges, yamlJsonObject, setYamlJsonObject } = useContext(FlowEditorContext);
  const nodeFilter = useCallback(
    node =>
      node.id !== id && node.type !== PipelineNodeTypes.Decision && node.type !== PipelineNodeTypes.Condition,
    [id],
  );
  const nodeOptions = useNodeOptions(nodeFilter, true);

  const onValueChange = useCallback(
    newValue => {
      if (newValue === value) return;
      setFlowEdges(prevEdges => prevEdges.filter(edge => !isDefaultOutputEdge(id)(edge)));
      if (newValue) {
        onConnectNodes?.({ source: id, sourceHandle: DEFAULT_OUTPUT, target: newValue, targetHandle: null });
      } else {
        FlowEditorHelpers.updateYamlNode(id, DEFAULT_OUTPUT, '', yamlJsonObject, setYamlJsonObject);
      }
    },
    [id, onConnectNodes, setFlowEdges, setYamlJsonObject, value, yamlJsonObject],
  );

  const onClear = useCallback(() => onValueChange(''), [onValueChange]);

  return (
    <Select.SingleSelect
      label="Default output"
      infoIconDescription={DEFAULT_OUTPUT_INFO}
      infoIconPinnable
      value={value}
      onValueChange={onValueChange}
      onClear={onClear}
      options={nodeOptions}
      disabled={disabled}
      showBorder
      className="nopan nodrag"
      data-testid="pipeline-decision-node-default-output-select"
    />
  );
});

DecisionDefaultOutputSelect.displayName = 'DecisionDefaultOutputSelect';

export default DecisionDefaultOutputSelect;
