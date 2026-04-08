import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, FormControlLabel, Switch, Typography } from '@mui/material';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
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

const CommonInterruptSettings = memo(props => {
  const { id, showStructuredOutput = true, type, disabled } = props;

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
          <Switch
            disabled={yamlJsonObject.entry_point === id || disabled}
            checked={
              yamlJsonObject.entry_point === id ? false : !!realInterruptBefore.find(item => item === id)
            }
            color="primary"
            onChange={onChangeInterruptBefore}
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
          <Switch
            disabled={yamlNode?.transition === PipelineNodeTypes.End || disabled}
            checked={
              yamlNode?.transition === PipelineNodeTypes.End
                ? false
                : !!realInterruptAfter.find(item => item === id)
            }
            color="primary"
            onChange={onChangeInterruptAfter}
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
            <Switch
              disabled={disabled}
              checked={!!yamlNode?.structured_output}
              color="primary"
              onChange={onChangeStructuredOutput}
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
