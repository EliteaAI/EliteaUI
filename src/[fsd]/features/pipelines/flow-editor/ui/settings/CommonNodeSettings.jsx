import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { Switch } from '@/[fsd]/shared/ui';

// Static "Interrupt before / after" toggles are deprecated (Phase 1): they are
// no longer rendered on node cards. `interrupt_before` / `interrupt_after` are
// still supported in the YAML editor and visualised as the interrupt label on
// edges — do not re-add per-node controls here.
//
// structuredOutputTestId (ELITEA-2004/2010): this component is shared across
// node types, so the testid is caller-supplied and opt-in per call site: only
// the node types a test actually touches pass a value; every other caller
// leaves it `undefined` so untested node types don't light up as "covered"
// (.agents/testing.md § Locator policy — testid scope is load-bearing).
const CommonNodeSettings = memo(props => {
  const { id, showStructuredOutput = true, type, disabled, structuredOutputTestId } = props;

  const { setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);
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

  const styles = commonNodeSettingsStyles();

  if (!showStructuredOutput) return null;

  return (
    <Box sx={styles.nodesRow}>
      <FormControlLabel
        sx={styles.formControlLabel}
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
    </Box>
  );
});

CommonNodeSettings.displayName = 'CommonNodeSettings';

/** @type {MuiSx} */
const commonNodeSettingsStyles = () => ({
  nodesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '.5rem',
    width: '100%',
    flexDirection: 'row',
  },
  formControlLabel: ({ palette }) => ({
    width: '13.375rem',
    height: '2rem',
    borderRadius: '0.5rem',
    marginLeft: '0rem',
    marginRight: '0rem',
    padding: '0.25rem 0.5rem',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    background: palette.background.surface.interactive.default,
  }),
});

export default CommonNodeSettings;
