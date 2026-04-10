import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { useFStringInputAutocomplete } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/hooks';
import { FStringAutocompletePopper } from '@/[fsd]/features/pipelines/fstring-autocomplete/ui';
import { Chip, Input } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { capitalizeFirstChar } from '@/common/utils.jsx';

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
    placeholder: '',
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
  };

  const popperSx = nodeFieldInputStyles(containerRef.current?.clientWidth);

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

const SimpleLLMInputItem = memo(props => {
  const {
    variableName,
    variable,
    type,
    value,
    defaultValue,
    onChangeMapping,
    disabled,
    // AI Assistant props
    enableAIAssistant = false,
    modelConfig = null,
  } = props;

  const typeOptions = useMemo(
    () =>
      FlowEditorConstants.agentTaskTypeOptions.filter(
        option => option.value !== 'fstring' || variable !== 'chat_history',
      ),
    [variable],
  );
  const stateVariableOptions = useInputOptions();
  const language =
    (type === 'fstring' || type === 'fixed') && variableName.toLowerCase() === 'code' ? 'python' : undefined;

  const onChange = useCallback(
    (field, newValue) => {
      if (field === 'type') {
        // Preserve value when switching between 'fstring' and 'fixed'
        // Clear value when switching to/from 'variable'
        const shouldPreserveValue =
          (type === 'fstring' && newValue === 'fixed') || (type === 'fixed' && newValue === 'fstring');

        onChangeMapping(variable, {
          type: newValue,
          value: shouldPreserveValue ? value : defaultValue,
        });
      } else {
        onChangeMapping(variable, {
          type,
          value: newValue,
        });
      }
    },
    [onChangeMapping, variable, type, value, defaultValue],
  );

  const onInput = useCallback(
    event => {
      event.preventDefault();
      if (variableName.toLowerCase() === 'chat_history' && type === 'fixed') {
        try {
          const parsedValue = JSON.parse(event.target.value);
          onChange('value', parsedValue);
        } catch {
          onChange('value', event.target.value);
        }
      } else {
        onChange('value', event.target.value);
      }
    },
    [onChange, type, variableName],
  );

  const shouldEnableAIAssistant =
    enableAIAssistant &&
    (type === 'fstring' || type === 'fixed') &&
    (variableName === 'system' ||
      variableName === 'task' ||
      variableName === 'code' ||
      variableName === 'printer' ||
      variableName === 'user_message');

  const enableFStringAutocomplete =
    type === 'fstring' && FlowEditorConstants.FSTRING_AUTOCOMPLETE_VARIABLES.has(variableName);

  const isStringType = type === 'string' || type === 'fstring' || type === 'fixed';

  const styles = simpleLLMInputItemStyles(isStringType);

  return (
    <Box sx={styles.container}>
      <Chip.HeadingChip label={capitalizeFirstChar(variableName.replaceAll('_', ' '))} />

      <Box sx={styles.fieldRow}>
        <Box sx={styles.typeSelectWrapper}>
          <SingleSelect
            sx={styles.select}
            label="Type"
            value={type}
            onValueChange={newValue => onChange('type', newValue)}
            options={typeOptions}
            disabled={disabled}
            showBorder
            className="nopan nodrag"
          />
        </Box>
        <Box sx={styles.valueWrapper}>
          {isStringType ? (
            <NodeFieldInput
              shouldEnableAIAssistant={shouldEnableAIAssistant}
              variable={variable}
              value={value}
              disabled={disabled}
              onInput={onInput}
              variableName={variableName}
              language={language}
              modelConfig={modelConfig}
              enableFStringAutocomplete={enableFStringAutocomplete}
              stateVariableOptions={stateVariableOptions}
            />
          ) : (
            <SingleSelect
              sx={styles.select}
              label="Value"
              value={value}
              onValueChange={newValue => onChange('value', newValue)}
              options={stateVariableOptions}
              disabled={disabled}
              showBorder
              className="nopan nodrag"
            />
          )}
        </Box>
      </Box>
    </Box>
  );
});

SimpleLLMInputItem.displayName = 'SimpleLLMInputItem';

/** @type {MuiSx} */
const simpleLLMInputItemStyles = (isStringType = true) => ({
  container: {},
  label: {
    marginBottom: '0.5rem',
  },
  fieldRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    minHeight: '3.79rem',
  },
  typeSelectWrapper: {
    width: '7.25rem',
    transform: 'translateY(0.89rem)',
  },
  valueWrapper: {
    flex: 1,
    transform: !isStringType ? 'translateY(0.89rem)' : undefined,
  },
  select: {
    marginBottom: '0rem',
  },
});

/** @type {MuiSx} */
const nodeFieldInputStyles = anchorWidth => ({
  width: anchorWidth || undefined,
});

export default SimpleLLMInputItem;
