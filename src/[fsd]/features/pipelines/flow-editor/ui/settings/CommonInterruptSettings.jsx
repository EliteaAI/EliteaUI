import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { Switch } from '@/[fsd]/shared/ui';
import styled from '@emotion/styled';

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  width: '13.375rem',
  height: '2rem',
  borderRadius: '.5rem',
  marginLeft: '0rem',
  marginRight: '0rem',
  padding: '.25rem .5rem',
  justifyContent: 'flex-start',
  gap: '.5rem',
  background: theme.palette.background.userInputBackground,
}));

// interruptAfterTestId / structuredOutputTestId (ELITEA-2004/2010): this
// component is shared across every node type (LLM, Toolkit, MCP, Agent,
// Code, Decision, Subgraph, deprecated Loop/Tool, ...). Unlike the sibling
// "Interrupt before" toggle (pipeline-node-interrupt-before-toggle-${id},
// ELITEA-2008 — unconditional, every node type), these two testids are
// caller-supplied and therefore opt-in per call site: only the node types a
// test actually touches pass a value; every other caller leaves them
// `undefined` so untested node types don't light up as "covered"
// (.agents/testing.md § Locator policy — testid scope is load-bearing).
const CommonInterruptSettings = memo(props => {
  const {
    id,
    showStructuredOutput = true,
    type,
    disabled,
    interruptAfterTestId,
    structuredOutputTestId,
  } = props;

  const { setYamlJsonObject, setFlowEdges, yamlJsonObject } = useContext(FlowEditorContext);
  const realInterruptBefore = useMemo(
    () => (Array.isArray(yamlJsonObject?.interrupt_before) ? yamlJsonObject?.interrupt_before : []),
    [yamlJsonObject?.interrupt_before],
  );
  const realInterruptAfter = useMemo(
    () => (Array.isArray(yamlJsonObject?.interrupt_after) ? yamlJsonObject?.interrupt_after : []),
    [yamlJsonObject?.interrupt_after],
  );
  const yamlNode = useMemo(
    () => yamlJsonObject?.nodes?.find(node => node.id === id && node.type === type),
    [id, type, yamlJsonObject?.nodes],
  );
  const onChangeStructuredOutput = useCallback(
    event => {
      FlowEditorHelpers.updateYamlNode(
        id,
        'structured_output',
        event.target.checked,
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [yamlJsonObject, setYamlJsonObject, id],
  );

  const onChangeInterruptBefore = useCallback(
    event => {
      const oldInterruptBefore = [...realInterruptBefore];
      if (event.target.checked) {
        setYamlJsonObject({
          ...yamlJsonObject,
          interrupt_before: [...oldInterruptBefore, id],
        });
      } else {
        setYamlJsonObject({
          ...yamlJsonObject,
          interrupt_before: oldInterruptBefore.filter(item => item !== id),
        });
      }
      setFlowEdges(prevEdges =>
        prevEdges.map(edge =>
          edge.target === id
            ? { ...edge, data: event.target.checked ? { label: 'interrupt' } : undefined }
            : edge,
        ),
      );
    },
    [id, realInterruptBefore, setFlowEdges, setYamlJsonObject, yamlJsonObject],
  );

  const onChangeInterruptAfter = useCallback(
    event => {
      const oldInterruptAfter = [...realInterruptAfter];
      if (event.target.checked) {
        setYamlJsonObject({
          ...yamlJsonObject,
          interrupt_after: [...oldInterruptAfter, id],
        });
      } else {
        setYamlJsonObject({
          ...yamlJsonObject,
          interrupt_after: oldInterruptAfter.filter(item => item !== id),
        });
      }
      setFlowEdges(prevEdges =>
        prevEdges.map(edge =>
          edge.source === id
            ? { ...edge, data: event.target.checked ? { label: 'interrupt' } : undefined }
            : edge,
        ),
      );
    },
    [id, realInterruptAfter, setFlowEdges, setYamlJsonObject, yamlJsonObject],
  );

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap=".5rem"
      width="100%"
      flexDirection="row"
    >
      <StyledFormControlLabel
        control={
          <Switch.BaseSwitch
            disabled={yamlJsonObject.entry_point === id || disabled}
            checked={
              yamlJsonObject.entry_point === id ? false : !!realInterruptBefore.find(item => item === id)
            }
            onChange={onChangeInterruptBefore}
            // data-testid on the native <input>, not the MuiSwitch-switchBase
            // wrapper: MUI v7's Switch silently DROPS a legacy `inputProps`
            // testid (its own `slotProps.input` is applied after `...other`
            // and always wins), so the testid has to reach MuiSwitch's real
            // `slotProps.input` — BaseSwitch's own `slotProps` prop only
            // spreads `slotProps.switch` onto <MuiSwitch> as raw props, so
            // nesting one level (`switch.slotProps.input`) is what actually
            // lands it on MuiSwitch's `slotProps` (confirmed live,
            // ELITEA-2008 automation fix; same family as ELITEA-2162).
            slotProps={{
              switch: {
                slotProps: {
                  input: { 'data-testid': `pipeline-node-interrupt-before-toggle-${id}` },
                },
              },
            }}
          />
        }
        label={
          <Typography
            variant="labelSmall"
            color={yamlJsonObject.entry_point === id ? 'text.default' : 'text.secondary'}
          >
            Interrupt before
          </Typography>
        }
        labelPlacement="end"
      />
      <StyledFormControlLabel
        control={
          <Switch.BaseSwitch
            disabled={yamlNode?.transition === PipelineNodeTypes.End || disabled}
            checked={
              yamlNode?.transition === PipelineNodeTypes.End
                ? false
                : !!realInterruptAfter.find(item => item === id)
            }
            onChange={onChangeInterruptAfter}
            data-testid={interruptAfterTestId}
          />
        }
        label={
          <Typography
            variant="labelSmall"
            color={yamlNode?.transition === PipelineNodeTypes.End ? 'text.default' : 'text.secondary'}
          >
            Interrupt after
          </Typography>
        }
        labelPlacement="end"
      />
      {showStructuredOutput && (
        <StyledFormControlLabel
          control={
            <Switch.BaseSwitch
              disabled={disabled}
              checked={!!yamlNode?.structured_output}
              onChange={onChangeStructuredOutput}
              data-testid={structuredOutputTestId}
            />
          }
          label={
            <Typography
              variant="labelSmall"
              color="text.secondary"
            >
              Structured output
            </Typography>
          }
          labelPlacement="end"
        />
      )}
    </Box>
  );
});

CommonInterruptSettings.displayName = 'CommonInterruptSettings';

export default CommonInterruptSettings;
