import { memo, useCallback, useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes, FlowEditorSettings } from '@/[fsd]/features/pipelines/flow-editor/ui';
import usePrinterInputMapping from '@/hooks/pipeline/usePrinterInputMapping';
import { useEdges } from '@xyflow/react';

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
        enableAIAssistant={true}
        modelConfig={pipelineLLMConfig}
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
      />
    </FlowEditorNodes.NodeCard>
  );
});

PrinterNode.displayName = 'PrinterNode';

export default PrinterNode;
