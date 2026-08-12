import { memo } from 'react';

import { Box } from '@mui/material';

import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { useFStringInputAutocomplete } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/hooks';
import { FStringAutocompletePopper } from '@/[fsd]/features/pipelines/fstring-autocomplete/ui';
import { Input } from '@/[fsd]/shared/ui';

const NodeFieldInput = memo(props => {
  const {
    shouldEnableAIAssistant,
    variable,
    value,
    disabled,
    onInput,
    variableName,
    language,
    modelConfig,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
    dataTestId,
  } = props;

  const resolvedValue = typeof value !== 'string' ? JSON.stringify(value) : value;

  const {
    autocompleteState,
    closeAutocomplete,
    containerRef,
    filteredOptions: filteredStateVariableOptions,
    handleAutocompleteKeyDown,
    handleChange: handleInput,
    handleCursorChange,
    handleSuggestionSelect,
    highlightedOptionIndex,
    inputRef,
  } = useFStringInputAutocomplete({
    resolvedValue,
    onInput,
    enabled: enableFStringAutocomplete && !disabled,
    options: stateVariableOptions,
  });

  const commonProps = {
    autoComplete: 'off',
    disabled,
    variant: 'standard',
    fullWidth: true,
    name: 'value',
    id: `${variable}-value`,
    label: 'Value',
    placeholder: enableFStringAutocomplete ? 'Use {state_key} for variables' : '',
    value: resolvedValue,
    onBlur: closeAutocomplete,
    onClick: handleCursorChange,
    onFocus: handleCursorChange,
    onInput: handleInput,
    onKeyDown: handleAutocompleteKeyDown,
    onKeyUp: handleCursorChange,
    hasActionsToolBar: true,
    showCopyAction: true,
    showExpandAction: true,
    fieldName: variableName,
    language,
    multiline: true,
    minRows: 1,
    collapseContent: true,
    containerProps: {
      marginBottom: '0px !important',
      className: 'nopan nodrag nowheel',
    },
    inputRef,
    inputProps: dataTestId ? { 'data-testid': dataTestId } : undefined,
  };

  const popperSx = nodeFieldInputPopperStyles(containerRef.current?.clientWidth);

  return (
    <Box ref={containerRef}>
      {shouldEnableAIAssistant ? (
        <AIAssistantInput
          {...commonProps}
          modelConfig={modelConfig}
          enableFStringAutocomplete={enableFStringAutocomplete}
          stateVariableOptions={stateVariableOptions}
        />
      ) : (
        <Input.StyledInputEnhancer
          {...commonProps}
          multiline={variable === 'chat_history'}
        />
      )}
      <FStringAutocompletePopper
        open={filteredStateVariableOptions.length > 0 && autocompleteState.isOpen}
        anchorEl={containerRef.current}
        options={filteredStateVariableOptions}
        highlightedIndex={highlightedOptionIndex}
        onSelect={handleSuggestionSelect}
        popperSx={popperSx}
      />
    </Box>
  );
});

NodeFieldInput.displayName = 'NodeFieldInput';

/** @type {MuiSx} */
const nodeFieldInputPopperStyles = anchorWidth => ({
  width: anchorWidth || undefined,
});

export default NodeFieldInput;
