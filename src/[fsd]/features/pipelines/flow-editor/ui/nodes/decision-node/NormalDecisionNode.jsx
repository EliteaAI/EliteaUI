import { memo, useCallback, useContext, useMemo } from 'react';

import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodePanel,
  FlowEditorNodes,
  FlowEditorSelect,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { useEdges } from '@xyflow/react';

import DecisionDefaultOutputSelect from './DecisionDefaultOutputSelect';
import { commonComponentStyles } from './DecisionNodeShared';
import DecisionOutputsSelect from './DecisionOutputsSelect';

// Output handles sit either side of the centre of the output edge
const NODES_HANDLE_OFFSET = 'calc(50% - 3.125rem)';
const DEFAULT_OUTPUT_HANDLE_OFFSET = 'calc(50% + 3.125rem)';

const NormalDecisionNode = memo(props => {
  const { id, data, selected } = props;
  const styles = componentStyles();
  const edges = useEdges();
  const { setYamlJsonObject, yamlJsonObject, isRunningPipeline, disabled, setFlowEdges } =
    useContext(FlowEditorContext);

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [yamlJsonObject.nodes, id],
  );
  const description = yamlNode?.description || '';
  const decisionOutput = useMemo(() => yamlNode?.nodes || [], [yamlNode?.nodes]);
  const isElseConnectable = !edges.find(
    edge => edge.source === id && edge.sourceHandle === FlowEditorConstants.DEFAULT_OUTPUT,
  );
  const pipelineLLMConfig = useNodeAiAssistantConfig();

  const onChangeDecisionDescription = useCallback(
    event => {
      event.preventDefault();

      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'description',
          event.target.value,
          yamlJsonObject,
          setYamlJsonObject,
        );
      }
    },
    [setYamlJsonObject, yamlJsonObject, yamlNode],
  );

  const onRemoveOutput = useCallback(
    output => () => {
      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'nodes',
          decisionOutput.filter(item => item !== output),
          yamlJsonObject,
          setYamlJsonObject,
        );
        setFlowEdges(prevEdges => prevEdges.filter(edge => edge.source != id || edge.target !== output));
      }
    },
    [yamlNode, decisionOutput, yamlJsonObject, setYamlJsonObject, setFlowEdges, id],
  );

  return (
    <FlowEditorNodes.NodeCard
      name={data.label}
      isEntrypoint={false}
      selected={selected}
      handles={() => {
        return (
          <>
            <FlowEditorNodes.CustomHandle
              type="target"
              id="target"
              isConnectable={!isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="nodes"
              isConnectable={!isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
              offset={NODES_HANDLE_OFFSET}
              outputIndex={0}
              outputCount={2}
              testId="pipeline-decision-node-output-handle"
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="default_output"
              label="Default output"
              isConnectable={isElseConnectable && !isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
              offset={DEFAULT_OUTPUT_HANDLE_OFFSET}
              outputIndex={1}
              outputCount={2}
              testId="pipeline-decision-node-default-output-handle"
            />
          </>
        );
      }}
      type={FlowEditorConstants.PipelineNodeTypes.Decision}
      isPerforming={data?.isPerforming}
      id={id}
    >
      <FlowEditorNodePanel.NodeConfigSection>
        <AIAssistantInput
          autoComplete="off"
          showexpandicon="true"
          multiline
          collapseContent
          variant="standard"
          fullWidth
          name="Description"
          id="description"
          label="Decision criteria"
          placeholder=""
          value={description}
          onInput={onChangeDecisionDescription}
          hasActionsToolBar
          fieldName={'description'}
          containerProps={styles.inputEnhancerContainer}
          disabled={isRunningPipeline || disabled}
          modelConfig={pipelineLLMConfig}
          inputProps={{ 'data-testid': 'pipeline-decision-node-description-input' }}
        />
        <DecisionOutputsSelect
          id={id}
          decisionOutput={decisionOutput}
          onRemoveOutput={onRemoveOutput}
          disabled={isRunningPipeline || disabled}
        />
        <DecisionDefaultOutputSelect
          id={id}
          value={yamlNode?.default_output || ''}
          disabled={isRunningPipeline || disabled}
        />
      </FlowEditorNodePanel.NodeConfigSection>
      <FlowEditorNodePanel.NodeConfigSection section={NodePanelConstants.NODE_CONFIG_SECTIONS.advanced}>
        <FlowEditorSelect.InputSelect
          id={id}
          inputFieldName={'input'}
          disabled={isRunningPipeline || disabled}
          dataTestId="pipeline-decision-node-input-select"
        />
      </FlowEditorNodePanel.NodeConfigSection>
    </FlowEditorNodes.NodeCard>
  );
});

NormalDecisionNode.displayName = 'NormalDecisionNode';

/** @type {MuiSx} */
const componentStyles = () => ({
  ...commonComponentStyles(),
});

export default NormalDecisionNode;
