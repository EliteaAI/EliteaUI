import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions, useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes } from '@/[fsd]/features/pipelines/flow-editor/ui';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import MultipleSelect from '@/components/MultipleSelect';
import { useEdges } from '@xyflow/react';

import { DecisionOutputs, commonComponentStyles } from './DecisionNodeShared';

const LegacyDecisionNode = memo(props => {
  const { id, data, selected } = props;
  const styles = componentStyles();
  const edges = useEdges();
  const { setFlowEdges, setFlowNodes, setYamlJsonObject, yamlJsonObject, isRunningPipeline, disabled } =
    useContext(FlowEditorContext);
  const pipelineLLMConfig = useNodeAiAssistantConfig();
  const inputOptions = useInputOptions();
  const realYamlNodeId = useMemo(() => id.replace(FlowEditorConstants.DECISION_NODE_ID_SUFFIX, ''), [id]);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === realYamlNodeId),
    [realYamlNodeId, yamlJsonObject.nodes],
  );
  const decision = useMemo(() => yamlNode?.decision || data?.decision, [data?.decision, yamlNode?.decision]);
  const description = useMemo(() => decision?.description || '', [decision?.description]);
  const decisionInput = useMemo(() => decision?.decisional_inputs || [], [decision?.decisional_inputs]);
  const decisionOutput = useMemo(() => decision?.nodes || [], [decision?.nodes]);
  const decisionElse = useMemo(() => decision?.default_output || '', [decision?.default_output]);
  const isElseConnectable = useMemo(
    () => !edges.find(edge => edge.source === id && edge.sourceHandle === 'default_output'),
    [edges, id],
  );

  const onChangeInput = useCallback(
    newValue => {
      const newDecision = {
        description,
        decisional_inputs: newValue,
        nodes: decisionOutput,
        default_output: decisionElse,
      };
      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'decision',
          newDecision,
          yamlJsonObject,
          setYamlJsonObject,
        );
      }
      setFlowNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  decision: { ...newDecision },
                },
              }
            : node,
        ),
      );
    },
    [
      description,
      decisionOutput,
      decisionElse,
      yamlNode,
      setFlowNodes,
      yamlJsonObject,
      setYamlJsonObject,
      id,
    ],
  );

  const onChangeDecisionDescription = useCallback(
    event => {
      event.preventDefault();
      const newDecision = {
        description: event.target.value,
        decisional_inputs: decisionInput,
        nodes: decisionOutput,
        default_output: decisionElse,
      };

      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'decision',
          newDecision,
          yamlJsonObject,
          setYamlJsonObject,
        );
      }
      setFlowNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  decision: { ...newDecision },
                },
              }
            : node,
        ),
      );
    },
    [
      decisionElse,
      decisionInput,
      decisionOutput,
      id,
      setFlowNodes,
      setYamlJsonObject,
      yamlJsonObject,
      yamlNode,
    ],
  );

  const onRemoveOutput = useCallback(
    output => () => {
      const newDecision = {
        description,
        decisional_inputs: decisionInput,
        nodes: decisionOutput.filter(item => item !== output),
        default_output: decisionElse,
      };
      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'decision',
          newDecision,
          yamlJsonObject,
          setYamlJsonObject,
        );
      }
      setFlowNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  decision: { ...newDecision },
                },
              }
            : node,
        ),
      );
      setFlowEdges(prevEdges =>
        prevEdges.filter(
          edge => edge.source != id || edge.sourceHandle !== 'nodes' || edge.target !== output,
        ),
      );
    },
    [
      description,
      decisionInput,
      decisionOutput,
      decisionElse,
      yamlNode,
      setFlowNodes,
      setFlowEdges,
      yamlJsonObject,
      setYamlJsonObject,
      id,
    ],
  );

  const realInputOptions = useMemo(() => {
    const optionsNotInState = decisionInput
      .filter(item => !inputOptions.find(option => option.value === item))
      .map(item => ({
        label: item,
        value: item,
        canDelete: true,
        tooltip: 'Not in state',
      }));
    return [...optionsNotInState, ...inputOptions];
  }, [decisionInput, inputOptions]);

  const onDeleteOption = useCallback(
    value => {
      onChangeInput(decisionInput.filter(item => item !== value));
    },
    [decisionInput, onChangeInput],
  );

  const renderValue = useCallback(
    values => {
      return values.map(value => {
        const canDelete = realInputOptions.find(option => option.value === value)?.canDelete;
        return (
          <Box
            key={value}
            sx={({ palette }) => ({
              ...styles.renderValueBox,
              background: canDelete ? palette.background.wrongBkg : palette.background.dataGrid.main,
            })}
          >
            <StyledTooltip
              placement="top"
              title={canDelete ? 'Not in state' : ''}
            >
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {value}
              </Typography>
            </StyledTooltip>
            {canDelete && (
              <StyledTooltip
                placement="top"
                title="Delete"
              >
                <Box sx={styles.deleteIconBox}>
                  <RemoveIcon
                    sx={styles.removeIcon}
                    onClick={() => onDeleteOption(value)}
                  />
                </Box>
              </StyledTooltip>
            )}
          </Box>
        );
      });
    },
    [onDeleteOption, realInputOptions, styles.renderValueBox, styles.removeIcon, styles.deleteIconBox],
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
      <MultipleSelect
        sx={styles.multipleSelect}
        label="Decision input"
        value={decisionInput}
        onValueChange={onChangeInput}
        options={realInputOptions}
        disabled={isRunningPipeline || disabled}
        showBorder
        emptyPlaceHolder=""
        labelSX={styles.labelSX}
        MenuProps={styles.menuProps}
        selectSX={styles.selectSX}
        className="nopan nodrag"
        valueItemSX={styles.valueItemSX}
        customRenderValue={renderValue}
        onDeleteOption={onDeleteOption}
      />
      <AIAssistantInput
        autoComplete="off"
        showexpandicon="true"
        maxRows={6}
        multiline
        variant="standard"
        fullWidth
        name="Description"
        id="description"
        label="Description"
        placeholder=""
        value={description}
        onInput={onChangeDecisionDescription}
        hasActionsToolBar
        fieldName="description"
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
    </FlowEditorNodes.NodeCard>
  );
});

LegacyDecisionNode.displayName = 'LegacyDecisionNode';

/** @type {MuiSx} */
const componentStyles = () => ({
  ...commonComponentStyles(),
  nodesHandle: {
    left: 'calc(50% - 3.125rem)',
  },
  defaultOutputHandle: {
    left: 'calc(50% + 3.125rem)',
  },
  renderValueBox: {
    height: '1.5rem',
    padding: '.25rem .75rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '.25rem',
    borderRadius: '1.25rem',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: '100%',
  },
  deleteIconBox: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: ({ palette }) => `${palette.icon.fill.secondary} !important`,
  },
  menuProps: {
    PaperProps: { style: { marginTop: '.5rem' } },
  },
});

export default LegacyDecisionNode;
