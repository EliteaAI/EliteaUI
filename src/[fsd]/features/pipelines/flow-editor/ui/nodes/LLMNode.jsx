import { memo, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  useGetToolkitNameFromSchema,
  useNodeAiAssistantConfig,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import useLLMInputMapping from '@/hooks/pipeline/useLLMInputMapping';
import { useEdges } from '@xyflow/react';

const LLMNode = memo(props => {
  const { id, data, selected } = props;

  const { yamlJsonObject, isRunningPipeline, disabled } = useContext(FlowEditorContext);
  const { values } = useFormikContext();
  const { getToolkitNameFromSchema, getSelectedTools } = useGetToolkitNameFromSchema();
  const pipelineLLMConfig = useNodeAiAssistantConfig();

  const flowEdges = useEdges();
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const isSourceConnectable = useMemo(
    () =>
      !flowEdges.find(
        edge => edge.source === id && edge.target !== FlowEditorConstants.PipelineNodeTypes.End,
      ),
    [flowEdges, id],
  );

  // Get all toolkits from version_details
  const allToolkits = useMemo(() => values?.version_details?.tools || [], [values?.version_details?.tools]);

  const { inputMappings, onChangeMapping, defaultValues } = useLLMInputMapping({ id });

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={FlowEditorConstants.PipelineNodeTypes.LLM}
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
      <FlowEditorSettings.SimpleLLMInputs
        inputMappings={inputMappings}
        values={yamlNode?.input_mapping || {}}
        onChangeMapping={onChangeMapping}
        defaultValues={defaultValues}
        disabled={isRunningPipeline || disabled}
        nodeType={FlowEditorConstants.PipelineNodeTypes.LLM}
        enableAIAssistant
        modelConfig={pipelineLLMConfig}
        gap="1rem"
      />

      <FlowEditorSelect.InputSelect
        id={id}
        label="Input"
        disabled={isRunningPipeline || disabled}
        inputFieldName="input"
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
        disabled={isRunningPipeline || disabled}
      />
      <FlowEditorSelect.ToolkitsSelect
        id={id}
        disabled={isRunningPipeline || disabled}
      />
      {Object.keys(yamlNode?.tool_names || {}).map(toolkitName => {
        const toolkitObj = allToolkits.find(
          tk => (tk.toolkit_name || getToolkitNameFromSchema(tk)) === toolkitName,
        );
        const allTools = (toolkitObj?.tools || toolkitObj?.settings?.selected_tools || []).map(tool =>
          typeof tool === 'string' ? tool : tool.name,
        );
        const availableTools = getSelectedTools(toolkitObj?.type);
        const tools =
          Array.isArray(availableTools) && availableTools.length > 0
            ? allTools.filter(tool => availableTools.includes(tool))
            : allTools;
        return (
          <FlowEditorSelect.LLMToolsSelect
            key={toolkitName}
            toolkitName={toolkitName}
            id={id}
            tools={tools}
            disabled={isRunningPipeline || disabled}
          />
        );
      })}
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        type={FlowEditorConstants.PipelineNodeTypes.LLM}
        disabled={isRunningPipeline || disabled}
      />
    </FlowEditorNodes.NodeCard>
  );
});

LLMNode.displayName = 'LLMNode';

export default LLMNode;
