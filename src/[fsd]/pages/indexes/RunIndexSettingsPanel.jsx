import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';
import { Select } from '@/[fsd]/shared/ui';

const RunIndexSettingsPanel = memo(props => {
  const {
    runToolOptions,
    selectedRunTool,
    onSelectRunTool,
    runFormFields,
    adjustedRunSchema,
    toolInputVariables,
    onChangeInputVariables,
    disabled,
  } = props;
  const styles = runIndexSettingsPanelStyles();

  return (
    <Box sx={styles.runSettings}>
      {runToolOptions.length === 0 ? (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          No run tools are enabled for this toolkit.
        </Typography>
      ) : (
        <>
          <Select.SingleSelect
            label="Tool"
            value={selectedRunTool ?? ''}
            onValueChange={onSelectRunTool}
            options={runToolOptions}
            showBorder
          />
          {runFormFields.map(key => (
            <ToolkitForm.ToolFormContainer
              key={key}
              fieldKey={key}
              property={adjustedRunSchema.properties[key]}
              toolInputVariables={toolInputVariables}
              schema={adjustedRunSchema}
              onChangeInputVariables={onChangeInputVariables}
              changesDisabled={disabled}
            />
          ))}
        </>
      )}
    </Box>
  );
});

RunIndexSettingsPanel.displayName = 'RunIndexSettingsPanel';

/** @type {MuiSx} */
const runIndexSettingsPanelStyles = () => ({
  runSettings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    padding: '0.5rem 0',
    width: '100%',
    maxWidth: '48rem',
  },
});

export default RunIndexSettingsPanel;
