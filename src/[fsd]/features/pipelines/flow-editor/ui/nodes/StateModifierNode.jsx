import { memo, useCallback, useContext, useMemo } from 'react';

import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes, FlowEditorSelect } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { useEdges } from '@xyflow/react';

const StateModifierNode = memo(props => {
  const { id, data, selected, nodeType = FlowEditorConstants.PipelineNodeTypes.StateModifier } = props;

  const edges = useEdges();
  const { yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const pipelineLLMConfig = useNodeAiAssistantConfig();
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const isSourceConnectable = useMemo(
    () =>
      !edges.find(edge => edge.source === id && edge.target !== FlowEditorConstants.PipelineNodeTypes.End),
    [edges, id],
  );

  const templateValue = useMemo(() => {
    return yamlNode?.template || '';
  }, [yamlNode?.template]);

  const handleTemplateFilling = useCallback(
    e => {
      FlowEditorHelpers.updateYamlNode(id, 'template', e.target.value, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={nodeType}
      isPerforming={data?.isPerforming}
      id={id}
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
              id="source"
              isConnectable={isSourceConnectable && !isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
          </>
        );
      }}
    >
      <AIAssistantInput
        multiline
        fullWidth
        disabled={isRunningPipeline || disabled}
        autoComplete="off"
        showexpandicon="true"
        collapseContent
        showCopyAction={true}
        showExpandAction={true}
        variant="standard"
        name="template"
        label="Jinja Template"
        placeholder=""
        value={templateValue}
        onInput={handleTemplateFilling}
        hasActionsToolBar
        fieldName="Template"
        language="jinja"
        containerProps={{
          marginBottom: '0rem !important',
          className: 'nowheel',
        }}
        modelConfig={pipelineLLMConfig}
        inputProps={{ 'data-testid': 'pipeline-state-modifier-node-template-input' }}
      />
      <FlowEditorSelect.InputSelect
        id={id}
        label="Variables to clean"
        inputFieldName="variables_to_clean"
        disabled={isRunningPipeline || disabled}
        dataTestId="pipeline-state-modifier-node-variables-to-clean-select"
      />
      <FlowEditorSelect.InputSelect
        id={id}
        label="Input"
        inputFieldName="input"
        disabled={isRunningPipeline || disabled}
        dataTestId="pipeline-state-modifier-node-input-select"
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
        disabled={isRunningPipeline || disabled}
        dataTestId="pipeline-state-modifier-node-output-select"
      />
    </FlowEditorNodes.NodeCard>
  );
});

StateModifierNode.displayName = 'StateModifierNode';

export default StateModifierNode;
