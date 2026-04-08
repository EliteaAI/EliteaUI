import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { useEdges } from '@xyflow/react';

import { DecisionOutputs, commonComponentStyles } from './DecisionNodeShared';

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
              style={styles.nodesHandle}
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="default_output"
              label="Default output"
              isConnectable={isElseConnectable && !isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
              style={styles.defaultOutputHandle}
            />
          </>
        );
      }}
      type={FlowEditorConstants.PipelineNodeTypes.Decision}
      isPerforming={data?.isPerforming}
      id={id}
    >
      <FlowEditorSelect.InputSelect
        id={id}
        inputFieldName={'input'}
        disabled={isRunningPipeline}
      />
      <AIAssistantInput
        autoComplete="off"
        showexpandicon="true"
        multiline
        collapseContent
        variant="standard"
        fullWidth
        name="Description"
        id="description"
        label="Description"
        placeholder=""
        value={description}
        onInput={onChangeDecisionDescription}
        hasActionsToolBar
        fieldName={'description'}
        containerProps={styles.inputEnhancerContainer}
        disabled={isRunningPipeline || disabled}
        modelConfig={pipelineLLMConfig}
      />
      <DecisionOutputs
        id={id}
        decisionOutput={decisionOutput}
        onRemoveOutput={onRemoveOutput}
        isRunningPipeline={isRunningPipeline}
        disabled={disabled}
      />
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        showStructuredOutput={false}
        type={FlowEditorConstants.PipelineNodeTypes.Decision}
        disabled={isRunningPipeline}
      />
    </FlowEditorNodes.NodeCard>
  );
});

NormalDecisionNode.displayName = 'NormalDecisionNode';

const componentStyles = () => ({
  ...commonComponentStyles(),
  nodesHandle: {
    left: 'calc(50% - 3.125rem)',
  },
  defaultOutputHandle: {
    left: 'calc(50% + 3.125rem)',
  },
});

export default NormalDecisionNode;
