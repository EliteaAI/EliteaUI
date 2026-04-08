import { memo, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import useCodeInputMapping from '@/hooks/pipeline/useCodeInputMapping.js';
import { useEdges } from '@xyflow/react';

const CodeNode = memo(props => {
  const { id, data, selected } = props;

  const { yamlJsonObject, isRunningPipeline, disabled } = useContext(FlowEditorContext);
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

  const { inputMappings, onChangeMapping, defaultValues } = useCodeInputMapping({ id });

  // Prepare values for SimpleLLMInputs - it expects { code: { type, value } }
  const codeValues = useMemo(
    () => ({
      code: yamlNode?.code || { type: 'fixed', value: '' },
    }),
    [yamlNode?.code],
  );

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={FlowEditorConstants.PipelineNodeTypes.Code}
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
        enableAIAssistant
        inputMappings={inputMappings}
        values={codeValues}
        onChangeMapping={onChangeMapping}
        defaultValues={defaultValues}
        disabled={isRunningPipeline || disabled}
        modelConfig={pipelineLLMConfig}
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
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        type={FlowEditorConstants.PipelineNodeTypes.Code}
        disabled={isRunningPipeline || disabled}
      />
    </FlowEditorNodes.NodeCard>
  );
});

CodeNode.displayName = 'CodeNode';

export default CodeNode;
