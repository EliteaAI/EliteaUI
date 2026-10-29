import { memo, useCallback, useContext, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Typography } from '@mui/material';

import {
  FlowEditorConstants,
  NodeFieldInfoConstants,
  NodePanelConstants,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers, NodeFieldInfoHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useFunctionInputMapping } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodePanel,
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { ToolPickerUI, usePipelineAttachments } from '@/[fsd]/features/pipelines/tool-picker';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import { useEdges } from '@xyflow/react';

const toolkitFilter = tool => tool.type === ToolTypes.application.value;

// Testid prefix for this node type (ELITEA-2038) — mirrors BaseToolNode.jsx's
// TEST_ID_PREFIX_BY_NODE_TYPE convention, but AgentNode is its own component
// (not a BaseToolNode caller), so the prefix is a local constant rather than
// a lookup map. Only the fields ELITEA-2038's test actually exercises are
// wired (.agents/testing.md § Locator policy — testid scope is load-bearing).
const AGENT_NODE_TESTID_PREFIX = 'pipeline-agent-node';

const TASK_KEY = 'task';
const CHAT_HISTORY_KEY = 'chat_history';
const BASIC_MAPPING_KEYS = [TASK_KEY];

const { NODE_FIELD_KEYS } = NodeFieldInfoConstants;

const getAgentFieldInfo = NodeFieldInfoHelpers.getNodeFieldInfoOf(
  FlowEditorConstants.PipelineNodeTypes.Agent,
);

const AgentNode = memo(props => {
  const { id, data, selected, nodeType = FlowEditorConstants.PipelineNodeTypes.Agent } = props;

  const edges = useEdges();
  const { yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const {
    values: { version_details },
  } = useFormikContext();
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const isSourceConnectable = useMemo(
    () =>
      !edges.find(edge => edge.source === id && edge.target !== FlowEditorConstants.PipelineNodeTypes.End),
    [edges, id],
  );

  const isOrphan = useMemo(() => {
    const boundTool = yamlNode?.tool;
    if (!boundTool) return false; // nothing bound — not an orphan
    const configuredTools = (version_details?.tools || []).filter(toolkitFilter);
    return configuredTools.length === 0 || !configuredTools.some(t => t.name === boundTool);
  }, [yamlNode?.tool, version_details?.tools]);

  const { onChangeMapping, requiredInputs, inputMappings, mappingInfo, defaultValues } =
    useFunctionInputMapping({ id });

  // Task is the essential input; chat history and the agent's own variables are optional
  const advancedMappingKeys = useMemo(
    () => [
      CHAT_HISTORY_KEY,
      ...Object.keys(inputMappings || {}).filter(key => key !== TASK_KEY && key !== CHAT_HISTORY_KEY),
    ],
    [inputMappings],
  );
  const mappingFieldsProps = {
    input_mapping: inputMappings,
    mappingInfo,
    defaultValues,
    values: yamlNode?.input_mapping || {},
    onChangeMapping,
    disabled: isRunningPipeline || disabled,
    nodeType: FlowEditorConstants.PipelineNodeTypes.Agent,
    valueTestIdPrefix: `${AGENT_NODE_TESTID_PREFIX}-input-mapping-value`,
    typeTestIdPrefix: `${AGENT_NODE_TESTID_PREFIX}-input-mapping-type`,
  };

  const { addTool, prepareApplicationAttachment, getAttachedApplication } = usePipelineAttachments();
  const attachedTool = useMemo(
    () => (yamlNode?.tool ? getAttachedApplication(yamlNode.tool) : undefined),
    [getAttachedApplication, yamlNode?.tool],
  );

  // Attaching waits for the agent details, so the YAML write must use the YAML as it is by then
  const yamlJsonObjectRef = useRef(yamlJsonObject);
  yamlJsonObjectRef.current = yamlJsonObject;

  const setAgentName = useCallback(
    name => {
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        name
          ? { toolkit_name: undefined, tool: name }
          : { toolkit_name: undefined, tool: undefined, input_mapping: undefined },
        yamlJsonObjectRef.current,
        setYamlJsonObject,
      );
    },
    [id, setYamlJsonObject],
  );

  // Any project agent or pipeline can be picked; one the pipeline doesn't have yet is attached on Save
  const onPickAgent = useCallback(
    async item => {
      if (item.isAttached) {
        setAgentName(item.name);
        return;
      }
      const tool = await prepareApplicationAttachment(item.source);
      if (!tool) return;
      // Same tick, so reconcile never sees the attachment without the node that uses it
      setAgentName(addTool(tool).name);
    },
    [addTool, prepareApplicationAttachment, setAgentName],
  );

  const onClearAgent = useCallback(() => setAgentName(null), [setAgentName]);

  return (
    <>
      <FlowEditorNodes.NodeCard
        name={id}
        isEntrypoint={yamlJsonObject.entry_point === id}
        selected={selected}
        type={nodeType}
        isPerforming={data?.isPerforming}
        id={id}
        requiredInputs={requiredInputs}
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
          {isOrphan && (
            <Box sx={agentNodeStyles.orphanWarning}>
              <WarningAmberIcon fontSize="small" />
              <Typography variant="caption">
                Agent not found — select a replacement or delete this node
              </Typography>
            </Box>
          )}
          <ToolPickerUI.ProjectAgentPicker
            tooltip={getAgentFieldInfo(NODE_FIELD_KEYS.agent)}
            value={yamlNode?.tool}
            onSelect={onPickAgent}
            onClear={onClearAgent}
            disabled={isRunningPipeline || disabled}
            data-testid={`${AGENT_NODE_TESTID_PREFIX}-agent-select`}
          />
          {attachedTool && (
            <ToolPickerUI.AgentVersionSelect
              tool={attachedTool}
              tooltip={getAgentFieldInfo(NODE_FIELD_KEYS.version)}
              disabled={isRunningPipeline || disabled}
              data-testid={`${AGENT_NODE_TESTID_PREFIX}-version-select`}
            />
          )}
          {!isOrphan && (
            <FlowEditorSettings.InputMappingFields
              keys={BASIC_MAPPING_KEYS}
              {...mappingFieldsProps}
            />
          )}
        </FlowEditorNodePanel.NodeConfigSection>
        <FlowEditorNodePanel.NodeConfigSection section={NodePanelConstants.NODE_CONFIG_SECTIONS.advanced}>
          <FlowEditorSelect.InputSelect
            id={id}
            label={'Input'}
            inputFieldName={'input'}
            disabled={isRunningPipeline || disabled}
            dataTestId={`${AGENT_NODE_TESTID_PREFIX}-input-select`}
          />
          <FlowEditorSelect.OutputSelect
            id={id}
            label="Output"
            outputFieldName="output"
            disabled={isRunningPipeline || disabled}
            dataTestId={`${AGENT_NODE_TESTID_PREFIX}-output-select`}
          />
          {!isOrphan && (
            <FlowEditorSettings.InputMappingFields
              keys={advancedMappingKeys}
              {...mappingFieldsProps}
            />
          )}
        </FlowEditorNodePanel.NodeConfigSection>
      </FlowEditorNodes.NodeCard>
    </>
  );
});

AgentNode.displayName = 'AgentNode';

/** @type {MuiSx} */
const agentNodeStyles = {
  orphanWarning: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.375rem',
    padding: '.375rem .75rem',
    borderRadius: '.375rem',
    backgroundColor: palette.warning.light,
    color: palette.warning.dark,
    width: '100%',
    boxSizing: 'border-box',
  }),
};

export default AgentNode;
