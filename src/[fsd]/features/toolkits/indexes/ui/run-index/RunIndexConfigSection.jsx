import { memo } from 'react';

import { Box, CircularProgress } from '@mui/material';

import { ToolkitForm } from '@/[fsd]/features/toolkits/ui';

const RunIndexConfigSection = memo(props => {
  const { configFields, configSchema, configInputVariables, onChangeInputVariables, disabled } = props;
  const styles = runIndexConfigSectionStyles();

  if (configFields.length === 0)
    return (
      <Box sx={styles.loadingRow}>
        <CircularProgress size={20} />
      </Box>
    );

  return (
    <Box sx={styles.configEditor}>
      {configFields.map(key => (
        <ToolkitForm.ToolFormContainer
          key={key}
          fieldKey={key}
          property={configSchema.properties[key]}
          toolInputVariables={configInputVariables}
          schema={configSchema}
          onChangeInputVariables={onChangeInputVariables}
          changesDisabled={disabled || key === 'index_name'}
        />
      ))}
    </Box>
  );
});

RunIndexConfigSection.displayName = 'RunIndexConfigSection';

/** @type {MuiSx} */
const runIndexConfigSectionStyles = () => ({
  loadingRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0',
  },
  configEditor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '48rem',
  },
});

export default RunIndexConfigSection;
