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

// Testid map for the Code node's CODE section (ELITEA-2009) — SimpleLLMInputs
// is shared with LLM/Printer nodes, so testids are supplied only at this call
// site (.agents/testing.md § Locator policy — testid scope is load-bearing;
// other node types stay untagged). Same shape as LLM_NODE_INPUT_TEST_IDS in
// LLMNode.jsx (ELITEA-2004).
const CODE_NODE_INPUT_TEST_IDS = {
  code: {
    typeSelectTestId: 'pipeline-code-node-type-select',
    valueFieldTestId: 'pipeline-code-node-value',
  },
};

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
        testIdsByKey={CODE_NODE_INPUT_TEST_IDS}
      />

      <FlowEditorSelect.InputSelect
        id={id}
        label="Input"
        disabled={isRunningPipeline || disabled}
        inputFieldName="input"
        dataTestId="pipeline-code-node-input-select"
      />
      <FlowEditorSelect.OutputSelect
        id={id}
        label="Output"
        outputFieldName="output"
        disabled={isRunningPipeline || disabled}
        dataTestId="pipeline-code-node-output-select"
      />
      <FlowEditorSettings.CommonInterruptSettings
        id={id}
        type={FlowEditorConstants.PipelineNodeTypes.Code}
        disabled={isRunningPipeline || disabled}
        interruptAfterTestId="pipeline-code-node-interrupt-after-toggle"
        structuredOutputTestId="pipeline-code-node-structured-output-toggle"
      />
    </FlowEditorNodes.NodeCard>
  );
});

CodeNode.displayName = 'CodeNode';

export default CodeNode;
