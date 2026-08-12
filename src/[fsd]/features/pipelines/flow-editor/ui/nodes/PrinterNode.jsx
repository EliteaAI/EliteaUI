import { memo, useCallback, useContext, useMemo } from 'react';

import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes, FlowEditorSettings } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import usePrinterInputMapping from '@/hooks/pipeline/usePrinterInputMapping';
import { useEdges } from '@xyflow/react';

// Testid map for the Printer node's PRINTER section (ELITEA-2039) —
// SimpleLLMInputs is shared with LLM/Code nodes, so testids are supplied
// only at this call site (.agents/testing.md § Locator policy — testid
// scope is load-bearing; other node types stay untagged). Same shape as
// CODE_NODE_INPUT_TEST_IDS in CodeNode.jsx (ELITEA-2009).
const PRINTER_NODE_INPUT_TEST_IDS = {
  printer: {
    typeSelectTestId: 'pipeline-printer-node-type-select',
    valueFieldTestId: 'pipeline-printer-node-value',
  },
};

const PrinterNode = memo(props => {
  const { id, data, selected } = props;

  const { yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const flowEdges = useEdges();
  const pipelineLLMConfig = useNodeAiAssistantConfig();

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

  const { inputMappings, onChangeMapping, defaultValues } = usePrinterInputMapping({ id });

  const finalMessageValue = useMemo(() => {
    return yamlNode?.final_message || '';
  }, [yamlNode?.final_message]);

  const handleFinalMessageChange = useCallback(
    e => {
      FlowEditorHelpers.updateYamlNode(
        id,
        'final_message',
        e.target.value,
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={FlowEditorConstants.PipelineNodeTypes.Printer}
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
              testId="pipeline-printer-node-target-handle"
            />
            <FlowEditorNodes.CustomHandle
              type="source"
              id="source"
              isConnectable={isSourceConnectable && !isRunningPipeline && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
              testId="pipeline-printer-node-source-handle"
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
        enableAIAssistant={true}
        modelConfig={pipelineLLMConfig}
        testIdsByKey={PRINTER_NODE_INPUT_TEST_IDS}
      />
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
        name="final_message"
        label="Final Message"
        placeholder=""
        value={finalMessageValue}
        onInput={handleFinalMessageChange}
        hasActionsToolBar
        fieldName="Final Message"
        language="text"
        containerProps={{
          marginBottom: '0rem !important',
          className: 'nowheel',
        }}
        modelConfig={pipelineLLMConfig}
        inputProps={{ 'data-testid': 'pipeline-printer-node-final-message-input' }}
      />
    </FlowEditorNodes.NodeCard>
  );
});

PrinterNode.displayName = 'PrinterNode';

export default PrinterNode;
