import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { Switch } from '@/[fsd]/shared/ui';

const CommonNodeSettings = memo(props => {
  const { id, type, disabled, structuredOutputTestId } = props;

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

  const styles = useMemo(() => commonNodeSettingsStyles(), []);

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
