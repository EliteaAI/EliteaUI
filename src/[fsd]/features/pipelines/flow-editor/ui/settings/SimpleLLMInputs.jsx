import { memo } from 'react';

import { Box } from '@mui/material';

import SimpleLLMInputItem from './SimpleLLMInputItem.jsx';

const SimpleLLMInputs = memo(props => {
  const {
    inputMappings,
    values,
    onChangeMapping,
    defaultValues,
    disabled,
    // AI Assistant props
    enableAIAssistant = false,
    modelConfig = null,
  } = props;

  const styles = simpleLLMInputsStyles();

  return (
    <Box sx={styles.container}>
      {Object.keys(inputMappings).map(key => (
        <SimpleLLMInputItem
          key={key}
          variableName={key}
          variable={key}
          type={(values[key] || inputMappings[key])?.type || 'fixed'}
          value={(values[key] || inputMappings[key])?.value || defaultValues[key] || ''}
          defaultValue={defaultValues[key] || ''}
          onChangeMapping={onChangeMapping}
          disabled={disabled}
          // AI Assistant props
          enableAIAssistant={enableAIAssistant}
          modelConfig={modelConfig}
        />
      ))}
    </Box>
  );
});

SimpleLLMInputs.displayName = 'SimpleLLMInputs';

/** @type {MuiSx} */
const simpleLLMInputsStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export default SimpleLLMInputs;
