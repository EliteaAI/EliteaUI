import { memo, useCallback, useContext, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import {
  FlowEditorConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import {
  useGetToolkitNameFromSchema,
  useNodeAiAssistantConfig,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodePanel,
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import {
  AttachmentToolHelpers,
  ToolPickerUI,
  usePipelineAttachments,
} from '@/[fsd]/features/pipelines/tool-picker';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import useLLMInputMapping from '@/hooks/pipeline/useLLMInputMapping';
import { useEdges } from '@xyflow/react';

// Testid map for the LLM node's SYSTEM/TASK/CHAT HISTORY sections
// (ELITEA-2004) — SimpleLLMInputs is shared with Code/Printer nodes, so
// testids are supplied only at this call site (.agents/testing.md § Locator
// policy — testid scope is load-bearing; other node types stay untagged).
const LLM_NODE_INPUT_TEST_IDS = {
  system: {
    typeSelectTestId: 'pipeline-llm-node-system-type-select',
    valueFieldTestId: 'pipeline-llm-node-system-value',
  },
  task: {
    typeSelectTestId: 'pipeline-llm-node-task-type-select',
    valueFieldTestId: 'pipeline-llm-node-task-value',
  },
  chat_history: {
    typeSelectTestId: 'pipeline-llm-node-chat-history-type-select',
    valueFieldTestId: 'pipeline-llm-node-chat-history-value',
  },
};

const BASIC_INPUT_KEYS = ['system', 'task'];
const ADVANCED_INPUT_KEYS = ['chat_history'];

const LLMNode = memo(props => {
  const { id, data, selected } = props;

  const { yamlJsonObject, setYamlJsonObject, isRunningPipeline, disabled } = useContext(FlowEditorContext);
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

  const { addTool, prepareToolkitAttachment } = usePipelineAttachments();
  const selectedToolkitNames = useMemo(() => Object.keys(yamlNode?.tool_names || {}), [yamlNode?.tool_names]);

  // Attaching may wait for the toolkit details, so YAML writes must use the YAML as it is by then
  const yamlJsonObjectRef = useRef(yamlJsonObject);
  yamlJsonObjectRef.current = yamlJsonObject;

  const setToolNames = useCallback(
    getNextToolNames => {
      const currentNode = yamlJsonObjectRef.current.nodes?.find(node => node.id === id);
      FlowEditorHelpers.updateYamlNode(
        id,
        'tool_names',
        getNextToolNames(currentNode?.tool_names || {}),
        yamlJsonObjectRef.current,
        setYamlJsonObject,
      );
    },
    [id, setYamlJsonObject],
  );

  // Any project toolkit or MCP can be added; one the pipeline doesn't have yet is attached on Save
  const onAddToolkit = useCallback(
    async (source, toolkitName, mcp) => {
      const prepared = await prepareToolkitAttachment(source, { mcp, toolkitName });
      if (!prepared) return;
      // Same tick as the `tool_names` write, so reconcile never sees the attachment without its node
      const attached = addTool(prepared);
      const availableTools = getSelectedTools(attached.type);
      const toolkitTools = AttachmentToolHelpers.getToolkitAvailableTools(attached).map(tool =>
        typeof tool === 'string' ? tool : tool.name,
      );
      const tools =
        availableTools.length > 0 ? toolkitTools.filter(tool => availableTools.includes(tool)) : toolkitTools;
      setToolNames(toolNames =>
        toolNames[toolkitName] ? toolNames : { ...toolNames, [toolkitName]: tools },
      );
    },
    [addTool, getSelectedTools, prepareToolkitAttachment, setToolNames],
  );

  const onRemoveToolkit = useCallback(
    toolkitName =>
      setToolNames(toolNames =>
        Object.fromEntries(Object.entries(toolNames).filter(([name]) => name !== toolkitName)),
      ),
    [setToolNames],
  );

  const onClearToolkits = useCallback(() => setToolNames(() => ({})), [setToolNames]);

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
      <FlowEditorNodePanel.NodeConfigSection>
        <ToolPickerUI.ProjectToolkitsMultiPicker
          value={selectedToolkitNames}
          onAdd={onAddToolkit}
          onRemove={onRemoveToolkit}
          onClear={onClearToolkits}
          disabled={isRunningPipeline || disabled}
          data-testid="pipeline-llm-node-toolkits-select"
        />
        {Object.keys(yamlNode?.tool_names || {}).map(toolkitName => {
          const toolkitObj = allToolkits.find(
            tk => (tk.toolkit_name || getToolkitNameFromSchema(tk)) === toolkitName,
          );
          // The pipeline narrows `selected_tools` to the tools its nodes use, so offer everything the toolkit has
          const allTools = (
            toolkitObj?.tools ||
            (toolkitObj ? AttachmentToolHelpers.getToolkitAvailableTools(toolkitObj) : [])
          ).map(tool => (typeof tool === 'string' ? tool : tool.name));
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
        <FlowEditorSettings.SimpleLLMInputs
          keys={BASIC_INPUT_KEYS}
          inputMappings={inputMappings}
          values={yamlNode?.input_mapping || {}}
          onChangeMapping={onChangeMapping}
          defaultValues={defaultValues}
          disabled={isRunningPipeline || disabled}
          nodeType={FlowEditorConstants.PipelineNodeTypes.LLM}
          enableAIAssistant
          modelConfig={pipelineLLMConfig}
          gap="1rem"
          testIdsByKey={LLM_NODE_INPUT_TEST_IDS}
        />
      </FlowEditorNodePanel.NodeConfigSection>
      <FlowEditorNodePanel.NodeConfigSection section={NodePanelConstants.NODE_CONFIG_SECTIONS.advanced}>
        <FlowEditorSelect.InputSelect
          id={id}
          label="Input"
          disabled={isRunningPipeline || disabled}
          inputFieldName="input"
          dataTestId="pipeline-llm-node-input-select"
        />
        <FlowEditorSelect.OutputSelect
          id={id}
          label="Output"
          outputFieldName="output"
          disabled={isRunningPipeline || disabled}
          dataTestId="pipeline-llm-node-output-select"
        />
        <FlowEditorSettings.SimpleLLMInputs
          keys={ADVANCED_INPUT_KEYS}
          inputMappings={inputMappings}
          values={yamlNode?.input_mapping || {}}
          onChangeMapping={onChangeMapping}
          defaultValues={defaultValues}
          disabled={isRunningPipeline || disabled}
          nodeType={FlowEditorConstants.PipelineNodeTypes.LLM}
          enableAIAssistant
          modelConfig={pipelineLLMConfig}
          gap="1rem"
          testIdsByKey={LLM_NODE_INPUT_TEST_IDS}
        />
        <FlowEditorSettings.CommonNodeSettings
          id={id}
          type={FlowEditorConstants.PipelineNodeTypes.LLM}
          disabled={isRunningPipeline || disabled}
          structuredOutputTestId="pipeline-llm-node-structured-output-toggle"
        />
      </FlowEditorNodePanel.NodeConfigSection>
    </FlowEditorNodes.NodeCard>
  );
});

LLMNode.displayName = 'LLMNode';

export default LLMNode;
