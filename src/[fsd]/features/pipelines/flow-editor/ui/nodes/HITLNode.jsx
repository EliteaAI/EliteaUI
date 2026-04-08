import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { FlowEditorContext } from '@/[fsd]/app/providers';
import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import {
  useInputOptions,
  useNodeAiAssistantConfig,
  useNodeOptions,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorNodes, FlowEditorSelect } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { LabelWithTooltip } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/InputMappings';
import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Chip } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useEdges } from '@xyflow/react';

const HITL_ACTIONS = [
  { label: 'Approve', chipLabel: 'APPROVE', value: 'approve' },
  { label: 'Edit', chipLabel: 'EDIT', value: 'edit' },
  { label: 'Reject', chipLabel: 'REJECT', value: 'reject' },
];

const INPUT_SELECT_TOOLTIP =
  'Select state variables to reference in the User message. Available only when the User message type is set to F-String.';

const HITLNode = memo(props => {
  const { id, data, selected } = props;

  const edges = useEdges();
  const { setFlowEdges, yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } =
    useContext(FlowEditorContext);
  const pipelineLLMConfig = useNodeAiAssistantConfig();
  const inputOptions = useInputOptions();

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const nodeOptions = useNodeOptions(node => node.id !== id, true);
  const editRouteOptions = useMemo(
    () => nodeOptions.filter(option => option.value !== FlowEditorConstants.PipelineNodeTypes.End),
    [nodeOptions],
  );

  const isTargetConnectable = useMemo(() => !edges.find(edge => edge.target === id), [edges, id]);

  const userMessageType = useMemo(() => yamlNode?.user_message?.type || 'fixed', [yamlNode?.user_message]);
  const userMessageValue = useMemo(() => yamlNode?.user_message?.value || '', [yamlNode?.user_message]);
  const isInputSelectDisabledByMessageType = userMessageType !== 'fstring';
  const isInputSelectDisabled = isInputSelectDisabledByMessageType || isRunningPipeline || disabled;

  const handleUserMessageTypeChange = useCallback(
    value => {
      const currentType = yamlNode?.user_message?.type || 'fixed';
      const isStringType = type => type === 'fstring' || type === 'fixed';
      const shouldPreserveValue = isStringType(currentType) && isStringType(value);
      const updates = {
        user_message: { type: value, value: shouldPreserveValue ? yamlNode?.user_message?.value : '' },
      };
      if (currentType === 'fstring' && value !== 'fstring') {
        updates.input = [];
      }
      FlowEditorHelpers.batchUpdateYamlNode(id, updates, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject, yamlNode?.user_message],
  );

  const handleUserMessageValueChange = useCallback(
    event => {
      FlowEditorHelpers.updateYamlNode(
        id,
        'user_message',
        { ...yamlNode?.user_message, value: event.target.value },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, setYamlJsonObject, yamlJsonObject, yamlNode?.user_message],
  );

  const handleUserMessageVariableChange = useCallback(
    value => {
      FlowEditorHelpers.updateYamlNode(
        id,
        'user_message',
        { ...yamlNode?.user_message, value },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, setYamlJsonObject, yamlJsonObject, yamlNode?.user_message],
  );

  const routes = useMemo(() => yamlNode?.routes || {}, [yamlNode?.routes]);

  const handleRouteChange = useCallback(
    (action, value) => {
      const newRoutes = { ...routes, [action]: value };
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          routes: newRoutes,
          transition: undefined,
        },
        yamlJsonObject,
        setYamlJsonObject,
      );

      setFlowEdges(prevEdges => {
        const filteredEdges = prevEdges.filter(
          edge =>
            edge.source !== id ||
            edge.sourceHandle !== `${FlowEditorConstants.HITL_HANDLE_ID_SUFFIX}_${action}`,
        );

        if (value) {
          return [
            ...filteredEdges,
            {
              id: `${FlowEditorConstants.EDGE_PREFIX}${id}${action}---${value}`,
              source: id,
              sourceHandle: `${FlowEditorConstants.HITL_HANDLE_ID_SUFFIX}_${action}`,
              target: value,
              type: 'custom',
              data: {
                label:
                  value !== FlowEditorConstants.PipelineNodeTypes.End &&
                  (yamlJsonObject.interrupt_before?.includes(value) ||
                    yamlJsonObject.interrupt_after?.includes(id))
                    ? 'interrupt'
                    : undefined,
              },
            },
          ];
        }

        return filteredEdges;
      });
    },
    [id, routes, setFlowEdges, setYamlJsonObject, yamlJsonObject],
  );

  const editStateKey = useMemo(() => yamlNode?.edit_state_key || '', [yamlNode?.edit_state_key]);
  const trimmedEditStateKey = useMemo(() => editStateKey.trim(), [editStateKey]);
  const editStateKeyOptions = useMemo(() => {
    if (!trimmedEditStateKey || inputOptions.find(option => option.value === trimmedEditStateKey)) {
      return inputOptions;
    }

    return [
      {
        label: `${trimmedEditStateKey} (not in state)`,
        value: trimmedEditStateKey,
      },
      ...inputOptions,
    ];
  }, [inputOptions, trimmedEditStateKey]);
  const hasConfiguredEditRoute = useMemo(() => Boolean(routes.edit), [routes.edit]);
  const isEditRouteInvalid = useMemo(
    () => hasConfiguredEditRoute && !trimmedEditStateKey,
    [hasConfiguredEditRoute, trimmedEditStateKey],
  );

  const handleEditStateKeyChange = useCallback(
    value => {
      FlowEditorHelpers.updateYamlNode(id, 'edit_state_key', value, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  const styles = hitlNodeStyles();

  return (
    <FlowEditorNodes.NodeCard
      name={id}
      isEntrypoint={yamlJsonObject.entry_point === id}
      selected={selected}
      type={FlowEditorConstants.PipelineNodeTypes.Hitl}
      isPerforming={data?.isPerforming}
      id={id}
      handles={() => {
        return (
          <>
            <FlowEditorNodes.CustomHandle
              type="target"
              id={FlowEditorConstants.HITL_HANDLE_ID_SUFFIX}
              isConnectable={!isRunningPipeline && isTargetConnectable && !disabled}
              isRunningPipeline={isRunningPipeline}
              isPerforming={data?.isPerforming}
            />
            {HITL_ACTIONS.map((action, index) => (
              <FlowEditorNodes.CustomHandle
                key={action.value}
                type="source"
                id={`${FlowEditorConstants.HITL_HANDLE_ID_SUFFIX}_${action.value}`}
                label={action.label}
                isConnectable={!isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
                style={{ left: `calc(25% + ${index * 25}%)` }}
              />
            ))}
          </>
        );
      }}
    >
      <Box sx={styles.section}>
        <StyledTooltip
          title={isInputSelectDisabledByMessageType ? INPUT_SELECT_TOOLTIP : ''}
          placement="top"
        >
          <Box
            component="span"
            sx={styles.inputSelectTooltipWrapper}
          >
            <FlowEditorSelect.InputSelect
              id={id}
              label={
                <LabelWithTooltip
                  title="Input"
                  tooltip={INPUT_SELECT_TOOLTIP}
                />
              }
              inputFieldName="input"
              disabled={isInputSelectDisabled}
            />
          </Box>
        </StyledTooltip>

        <Box sx={styles.controlGroup}>
          <Chip.HeadingChip label="User message" />
          <Box sx={styles.userMessageRow}>
            <Box sx={styles.typeField}>
              <SingleSelect
                sx={styles.typeSelect}
                label="Type"
                value={userMessageType}
                onValueChange={handleUserMessageTypeChange}
                options={FlowEditorConstants.agentTaskTypeOptions}
                disabled={isRunningPipeline || disabled}
                showBorder
                className="nopan nodrag"
              />
            </Box>
            <Box sx={styles.valueField}>
              {userMessageType === 'variable' ? (
                <SingleSelect
                  sx={styles.typeSelect}
                  label="Value"
                  value={userMessageValue}
                  onValueChange={handleUserMessageVariableChange}
                  options={inputOptions}
                  disabled={isRunningPipeline || disabled}
                  showBorder
                  className="nopan nodrag"
                />
              ) : (
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
                  name="user_message_value"
                  label="Value"
                  placeholder={userMessageType === 'fstring' ? 'Use {state_key} for variables' : ''}
                  value={userMessageValue}
                  onInput={handleUserMessageValueChange}
                  hasActionsToolBar
                  fieldName="User message"
                  language="text"
                  containerProps={{
                    marginBottom: '0rem !important',
                    className: 'nowheel',
                  }}
                  modelConfig={pipelineLLMConfig}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <BasicAccordion
        showMode={AccordionConstants.AccordionShowMode.LeftMode}
        accordionSX={styles.accordion}
        summarySX={styles.accordionSummary}
        titleSX={styles.accordionTitle}
        accordionDetailsSX={styles.accordionDetails}
        items={[
          {
            title: 'Router mapping',
            content: (
              <Box sx={styles.section}>
                {HITL_ACTIONS.map(action => (
                  <Box
                    key={action.value}
                    sx={styles.controlGroup}
                  >
                    <Chip.HeadingChip label={action.chipLabel} />
                    <SingleSelect
                      sx={styles.routeSelect}
                      label="Route"
                      value={routes[action.value] || ''}
                      onValueChange={value => handleRouteChange(action.value, value)}
                      options={action.value === 'edit' ? editRouteOptions : nodeOptions}
                      disabled={
                        isRunningPipeline ||
                        disabled ||
                        (action.value === 'edit' && !trimmedEditStateKey && !hasConfiguredEditRoute)
                      }
                      error={action.value === 'edit' && isEditRouteInvalid}
                      showBorder
                      className="nopan nodrag"
                    />
                  </Box>
                ))}
              </Box>
            ),
          },
        ]}
      />

      <Box sx={styles.editStateKeySection}>
        <Chip.HeadingChip label="Edit state key" />
        <SingleSelect
          sx={styles.routeSelect}
          label="Value"
          value={editStateKey}
          onValueChange={handleEditStateKeyChange}
          options={editStateKeyOptions}
          disabled={isRunningPipeline || disabled}
          error={isEditRouteInvalid}
          showBorder
          className="nopan nodrag"
        />
      </Box>
      {isEditRouteInvalid && (
        <Typography
          variant="bodySmall"
          color="error.main"
          sx={styles.validationText}
        >
          Provide an edit state key before using the Edit route.
        </Typography>
      )}
    </FlowEditorNodes.NodeCard>
  );
});

HITLNode.displayName = 'HITLNode';

/** @type {MuiSx} */
const hitlNodeStyles = () => ({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    width: '100%',
    marginBottom: '1rem',
  },
  accordion: ({ palette }) => ({
    background: palette.background.tabPanel,
  }),
  accordionSummary: ({ palette }) => ({
    background: palette.background.userInputBackground,
    borderRadius: '0.5rem',
    minHeight: '2rem',
    marginBottom: '0.75rem',
  }),
  accordionTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  accordionDetails: {
    paddingLeft: '0rem',
    marginTop: '0.5rem',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  editStateKeySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    marginBottom: '1rem',
  },
  userMessageRow: {
    display: 'flex',
    gap: '1rem',
    width: '100%',
    alignItems: 'flex-end',
  },
  typeField: {
    width: '7.25rem',
    flexShrink: 0,
  },
  valueField: {
    flex: 1,
    minWidth: 0,
  },
  typeSelect: {
    marginBottom: '0rem',
  },
  routeSelect: {
    marginBottom: '0rem',
  },
  inputSelectTooltipWrapper: {
    display: 'block',
    width: '100%',
  },
  validationText: {
    width: '100%',
  },
});

export default HITLNode;
