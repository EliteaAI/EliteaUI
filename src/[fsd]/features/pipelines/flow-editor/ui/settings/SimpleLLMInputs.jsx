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
    // Spacing
    gap,
    // Testid props (ELITEA-2004) — this component is shared across Pipeline
    // node types (LLM/Code/Printer); testids are threaded per input-mapping
    // key via this optional map and wired only at the call sites that need
    // them, never hardcoded here, per .agents/testing.md § Locator policy
    // (shared components / testid scope discipline).
    testIdsByKey = {},
  } = props;

  const styles = simpleLLMInputsStyles(gap);

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
          typeSelectTestId={testIdsByKey[key]?.typeSelectTestId}
          valueFieldTestId={testIdsByKey[key]?.valueFieldTestId}
        />
      ))}
    </Box>
  );
});

SimpleLLMInputs.displayName = 'SimpleLLMInputs';

/** @type {MuiSx} */
const simpleLLMInputsStyles = gap => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap,
  },
});

export default SimpleLLMInputs;
