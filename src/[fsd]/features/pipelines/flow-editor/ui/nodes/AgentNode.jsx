import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Typography } from '@mui/material';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import {
  useFunctionInputMapping,
  useGetToolkitNameFromSchema,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import { useEdges } from '@xyflow/react';

const toolkitFilter = tool => tool.type === ToolTypes.application.value;

// Testid prefix for this node type (ELITEA-2038) — mirrors BaseToolNode.jsx's
// TEST_ID_PREFIX_BY_NODE_TYPE convention, but AgentNode is its own component
// (not a BaseToolNode caller), so the prefix is a local constant rather than
// a lookup map. Only the fields ELITEA-2038's test actually exercises are
// wired (.agents/testing.md § Locator policy — testid scope is load-bearing).
const AGENT_NODE_TESTID_PREFIX = 'pipeline-agent-node';

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

  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();
  const onSelectToolkit = useCallback(
    newToolkit => {
      if (!newToolkit) {
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          { toolkit_name: undefined, tool: undefined, input_mapping: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
        return;
      }
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          toolkit_name:
            newToolkit.type !== ToolTypes.application.value
              ? newToolkit.toolkit_name || getToolkitNameFromSchema(newToolkit)
              : undefined,
          tool: newToolkit.type === ToolTypes.application.value ? newToolkit.name : undefined,
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, yamlJsonObject, setYamlJsonObject, getToolkitNameFromSchema],
  );

  return (
    <>
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
        {isOrphan && (
          <Box sx={agentNodeStyles.orphanWarning}>
            <WarningAmberIcon fontSize="small" />
            <Typography variant="caption">
              Agent not found — select a replacement or delete this node
            </Typography>
          </Box>
        )}
        <FlowEditorSelect.ToolSelect
          id={id}
          label={'Agent'}
          onSelectTool={onSelectToolkit}
          selectedToolkit={yamlNode?.tool}
          disabled={isRunningPipeline || disabled}
          filterTypes={toolkitFilter}
          data-testid={`${AGENT_NODE_TESTID_PREFIX}-agent-select`}
        />
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
          <FlowEditorSettings.InputMapping
            requiredInputs={requiredInputs}
            input_mapping={inputMappings}
            mappingInfo={mappingInfo}
            defaultValues={defaultValues}
            values={yamlNode?.input_mapping || {}}
            onChangeMapping={onChangeMapping}
            disabled={isRunningPipeline || disabled}
            valueTestIdPrefix={`${AGENT_NODE_TESTID_PREFIX}-input-mapping-value`}
            typeTestIdPrefix={`${AGENT_NODE_TESTID_PREFIX}-input-mapping-type`}
            requiredHeadingTestId={`${AGENT_NODE_TESTID_PREFIX}-input-mapping-heading`}
          />
        )}
        <FlowEditorSettings.CommonInterruptSettings
          id={id}
          type={FlowEditorConstants.PipelineNodeTypes.Agent}
          disabled={isRunningPipeline || disabled}
          showStructuredOutput={false}
          interruptAfterTestId={`${AGENT_NODE_TESTID_PREFIX}-interrupt-after-toggle`}
        />
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
    backgroundColor: palette.warning.light ?? '#fff3e0',
    color: palette.warning.dark ?? '#e65100',
    width: '100%',
    boxSizing: 'border-box',
  }),
};

export default AgentNode;
