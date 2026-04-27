import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { DecisionOutputHelpers, FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions, useNodeAiAssistantConfig } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes } from '@/[fsd]/features/pipelines/flow-editor/ui';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import StyledChip from '@/components/DataDisplay/StyledChip';
import MultipleSelect from '@/components/MultipleSelect';
import { useEdges, useNodes } from '@xyflow/react';

const ConditionNode = memo(props => {
  const { id, data, selected } = props;

  const styles = conditionNodeStyles();
  const { setFlowEdges, setFlowNodes, setYamlJsonObject, yamlJsonObject, isRunningPipeline, disabled } =
    useContext(FlowEditorContext);
  const pipelineLLMConfig = useNodeAiAssistantConfig();
  const inputOptions = useInputOptions();
  const flowNodes = useNodes();
  const flowEdges = useEdges();
  const yamlNode = useMemo(
    () =>
      yamlJsonObject.nodes?.find(
        node => node.id === id.replace(FlowEditorConstants.CONDITION_NODE_ID_SUFFIX, ''),
      ),
    [id, yamlJsonObject.nodes],
  );
  const condition = yamlNode?.condition || data?.condition;
  const condition_definition = useMemo(
    () => condition?.condition_definition || '',
    [condition?.condition_definition],
  );
  const conditionInput = useMemo(() => condition?.condition_input || [], [condition?.condition_input]);
  const conditionOutput = useMemo(
    () => condition?.conditional_outputs || [],
    [condition?.conditional_outputs],
  );
  const conditionElse = useMemo(() => condition?.default_output || '', [condition?.default_output]);
  const isElseConnectable = useMemo(
    () =>
      !flowEdges.find(edge => edge.source === id && edge.sourceHandle === FlowEditorConstants.DEFAULT_OUTPUT),
    [flowEdges, id],
  );
  const isTargetConnectable = useMemo(() => !flowEdges.find(edge => edge.target === id), [flowEdges, id]);

  const onChangeInput = useCallback(
    newValue => {
      const newCondition = {
        condition_definition,
        condition_input: newValue,
        conditional_outputs: conditionOutput,
        default_output: conditionElse,
      };
      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'condition',
          newCondition,
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
                  condition: { ...newCondition },
                },
              }
            : node,
        ),
      );
    },
    [
      condition_definition,
      conditionElse,
      conditionOutput,
      id,
      setFlowNodes,
      setYamlJsonObject,
      yamlJsonObject,
      yamlNode,
    ],
  );

  const onChangeConditionDefinition = useCallback(
    event => {
      event.preventDefault();
      const newCondition = {
        condition_definition: event.target.value,
        condition_input: conditionInput,
        conditional_outputs: conditionOutput,
        default_output: conditionElse,
      };
      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'condition',
          newCondition,
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
                  condition: { ...newCondition },
                },
              }
            : node,
        ),
      );
    },
    [
      conditionElse,
      conditionInput,
      conditionOutput,
      id,
      setFlowNodes,
      setYamlJsonObject,
      yamlJsonObject,
      yamlNode,
    ],
  );

  const onRemoveOutput = useCallback(
    output => () => {
      const newCondition = {
        condition_definition,
        condition_input: conditionInput,
        conditional_outputs: conditionOutput.filter(item => item !== output),
        default_output: conditionElse,
      };
      if (yamlNode) {
        FlowEditorHelpers.updateYamlNode(
          yamlNode.id,
          'condition',
          newCondition,
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
                  condition: { ...newCondition },
                },
              }
            : node,
        ),
      );
      setFlowEdges(prevEdges =>
        prevEdges.filter(
          edge => edge.source != id || edge.sourceHandle !== 'conditional_outputs' || edge.target !== output,
        ),
      );
    },
    [
      condition_definition,
      conditionElse,
      conditionInput,
      conditionOutput,
      id,
      setFlowEdges,
      setFlowNodes,
      setYamlJsonObject,
      yamlJsonObject,
      yamlNode,
    ],
  );

  const realInputOptions = useMemo(() => {
    const optionsNotInState = conditionInput
      .filter(item => !inputOptions.find(option => option.value === item))
      .map(item => ({
        label: item,
        value: item,
        canDelete: true,
        tooltip: 'Not in state',
      }));
    return [...optionsNotInState, ...inputOptions];
  }, [conditionInput, inputOptions]);

  const onDeleteOption = useCallback(
    value => {
      onChangeInput(conditionInput.filter(item => item !== value));
    },
    [conditionInput, onChangeInput],
  );

  const renderValue = useCallback(
    values => {
      return values.map(value => {
        const canDelete = realInputOptions.find(option => option.value === value)?.canDelete;
        return (
          <Box
            key={value}
            sx={styles.renderValueItem(canDelete)}
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
                <Box sx={styles.deleteIconContainer}>
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
    [onDeleteOption, realInputOptions, styles],
  );

  return (
    <>
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
                isConnectable={isTargetConnectable && !isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
              <FlowEditorNodes.CustomHandle
                type="source"
                id="conditional_outputs"
                style={styles.conditionalOutput}
                isConnectable={!isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
              <FlowEditorNodes.CustomHandle
                type="source"
                id="default_output"
                style={styles.defaultOutput}
                label="Default output"
                isConnectable={isElseConnectable && !isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
            </>
          );
        }}
        type={FlowEditorConstants.PipelineNodeTypes.Condition}
        isPerforming={data?.isPerforming}
        id={id}
      >
        <MultipleSelect
          sx={styles.multipleSelect}
          label="Conditional input"
          value={conditionInput}
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
          name="Condition"
          id="Condition"
          label="Condition"
          placeholder=""
          value={condition_definition}
          onInput={onChangeConditionDefinition}
          hasActionsToolBar
          fieldName="Condition"
          language="jinja"
          containerProps={styles.inputEnhancerContainer}
          disabled={isRunningPipeline || disabled}
          modelConfig={pipelineLLMConfig}
        />
        <Box sx={styles.conditionalOutputsContainer}>
          <Typography
            variant="bodySmall"
            color="text.default"
          >
            Conditional outputs
          </Typography>
          <Box sx={styles.outputsBorderContainer}>
            {(condition?.conditional_outputs || []).map(item => {
              const { borderColor, tooltip } = DecisionOutputHelpers.getBorderColorAndTooltip(
                flowEdges,
                flowNodes,
                id,
                item,
              );
              return (
                <StyledTooltip
                  key={item}
                  title={tooltip}
                  placement="top"
                >
                  <StyledChip
                    label={item}
                    className="nopan nodrag nowheel"
                    sx={styles.outputChip(borderColor)}
                    deleteIcon={<RemoveIcon />}
                    onDelete={onRemoveOutput(item)}
                  />
                </StyledTooltip>
              );
            })}
          </Box>
        </Box>
      </FlowEditorNodes.NodeCard>
    </>
  );
});

ConditionNode.displayName = 'ConditionNode';

/** @type {MuiSx} */
const conditionNodeStyles = () => ({
  // MultipleSelect styles
  multipleSelect: {
    marginBottom: '0rem',
  },
  labelSX: {
    left: '0.75rem',
    '& .Mui-focused': {
      top: '-0.3125rem',
    },
  },
  selectSX: {
    '& .MuiSelect-icon': {
      top: 'calc(50% - 0.6875rem) !important',
    },
  },
  valueItemSX: {
    maxWidth: '100% !important',
    overflow: 'scroll !important',
    gap: '0.75rem',
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: '0.25rem',
  },
  menuProps: {
    PaperProps: {
      style: {
        marginTop: '0.5rem',
      },
    },
  },

  // Render value styles
  renderValueItem: canDelete => ({
    height: '1.5rem',
    padding: '0.25rem 0.75rem',
    flexDirection: 'row',
    display: 'flex',
    gap: '0.25rem',
    borderRadius: '1.25rem',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: '100%',
    background: ({ palette }) => (canDelete ? palette.background.wrongBkg : palette.background.dataGrid.main),
  }),
  deleteIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: ({ palette }) => palette.icon.fill.secondary,
  },
  removeIcon: {
    cursor: 'pointer',
  },

  inputEnhancerContainer: {
    marginBottom: '0px !important',
    className: 'nopan nodrag nowheel',
  },

  conditionalOutputsContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: '0.5rem 0rem',
    gap: '0.5rem',
    overflow: 'hidden',
  },
  outputsBorderContainer: ({ palette }) => ({
    width: '100%',
    height: 'auto',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    gap: '0.5rem',
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  }),
  outputChip: borderColor => ({
    padding: '0rem 0.5rem',
    height: '1.5rem',
    borderRadius: '1.25rem',
    marginBottom: '0rem',
    marginRight: '0rem',
    gap: '0.25rem',
    border: `0.0625rem solid ${borderColor} !important`,
    '& .MuiChip-deleteIcon': {
      margin: '0rem',
      color: ({ palette }) => palette.icon.fill.secondary,
      '&:hover': {
        color: ({ palette }) => palette.icon.fill.secondary,
      },
    },
  }),
  conditionalOutput: {
    left: 'calc(50% - 2.5rem)',
  },
  defaultOutput: {
    left: 'calc(50% + 2.5rem)',
  },
});

export default ConditionNode;
