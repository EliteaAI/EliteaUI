import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box } from '@mui/material';

import { AIAssistantInput } from '@/[fsd]/features/pipelines/ai-assistant/ui';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FStringAutocompleteHelpers } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/helpers';
import { FStringAutocompletePopper } from '@/[fsd]/features/pipelines/fstring-autocomplete/ui';
import { Chip, Input } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { capitalizeFirstChar } from '@/common/utils.jsx';

const CLOSED_FSTRING_AUTOCOMPLETE = FStringAutocompleteHelpers.createClosedFStringAutocompleteState();

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

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const pendingCursorPositionRef = useRef(null);
  const [autocompleteState, setAutocompleteState] = useState(CLOSED_FSTRING_AUTOCOMPLETE);
  const resolvedValue = typeof value !== 'string' ? JSON.stringify(value) : value;
  const shouldShowAutocomplete = enableFStringAutocomplete && !disabled && stateVariableOptions.length > 0;

  const filteredStateVariableOptions = useMemo(() => {
    if (!shouldShowAutocomplete || !autocompleteState.isOpen) {
      return [];
    }

    return FStringAutocompleteHelpers.filterFStringAutocompleteOptions(
      stateVariableOptions,
      autocompleteState.query,
    );
  }, [autocompleteState.isOpen, autocompleteState.query, shouldShowAutocomplete, stateVariableOptions]);

  const highlightedOptionIndex = FStringAutocompleteHelpers.getFStringAutocompleteHighlightedIndex(
    autocompleteState.activeIndex,
    filteredStateVariableOptions,
  );

  const updateAutocompleteState = useCallback(
    (nextValue, cursorPosition) => {
      if (!shouldShowAutocomplete) {
        setAutocompleteState(CLOSED_FSTRING_AUTOCOMPLETE);
        return;
      }

      const nextState = FStringAutocompleteHelpers.getFStringAutocompleteState(nextValue, cursorPosition);

      setAutocompleteState(prevState => {
        // Preserve the user's highlighted position when the query hasn't changed
        // (e.g. cursor moved without editing text), so the selection doesn't jump.
        if (nextState.isOpen && prevState.isOpen && nextState.query === prevState.query) {
          return { ...nextState, activeIndex: prevState.activeIndex };
        }

        return nextState;
      });
    },
    [shouldShowAutocomplete],
  );

  const handleInput = useCallback(
    event => {
      onInput(event);
      updateAutocompleteState(event.target.value, event.target.selectionStart ?? event.target.value.length);
    },
    [onInput, updateAutocompleteState],
  );

  const handleCursorChange = useCallback(
    event => {
      if (event.target?.value === undefined) {
        return;
      }

      updateAutocompleteState(event.target.value, event.target.selectionStart ?? event.target.value.length);
    },
    [updateAutocompleteState],
  );

  const handleBlur = useCallback(() => {
    setAutocompleteState(CLOSED_FSTRING_AUTOCOMPLETE);
  }, []);

  const handleSuggestionSelect = useCallback(
    selectedVariable => {
      const { cursorPosition, nextValue } = FStringAutocompleteHelpers.getFStringAutocompleteInsertion(
        resolvedValue,
        autocompleteState,
        selectedVariable,
      );

      pendingCursorPositionRef.current = cursorPosition;
      onInput({
        preventDefault: () => {},
        target: {
          value: nextValue,
        },
      });
      setAutocompleteState(CLOSED_FSTRING_AUTOCOMPLETE);
    },
    [autocompleteState, onInput, resolvedValue],
  );

  const handleKeyDown = useCallback(
    event => {
      if (!autocompleteState.isOpen || filteredStateVariableOptions.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAutocompleteState(prevState => ({
          ...prevState,
          activeIndex:
            prevState.activeIndex >= filteredStateVariableOptions.length - 1 ? 0 : prevState.activeIndex + 1,
        }));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAutocompleteState(prevState => ({
          ...prevState,
          activeIndex:
            prevState.activeIndex <= 0 ? filteredStateVariableOptions.length - 1 : prevState.activeIndex - 1,
        }));
        return;
      }

      if (event.key === 'Enter') {
        const selectedOption = filteredStateVariableOptions[highlightedOptionIndex];

        if (selectedOption) {
          event.preventDefault();
          handleSuggestionSelect(selectedOption.value);
        }

        return;
      }

      if (event.key === 'Escape') {
        setAutocompleteState(CLOSED_FSTRING_AUTOCOMPLETE);
      }
    },
    [autocompleteState.isOpen, filteredStateVariableOptions, handleSuggestionSelect, highlightedOptionIndex],
  );

  useEffect(() => {
    if (pendingCursorPositionRef.current === null) {
      return undefined;
    }

    const cursorPosition = pendingCursorPositionRef.current;
    const animationFrameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange?.(cursorPosition, cursorPosition);
      pendingCursorPositionRef.current = null;
      updateAutocompleteState(resolvedValue, cursorPosition);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [resolvedValue, updateAutocompleteState]);

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
    onBlur: handleBlur,
    onClick: handleCursorChange,
    onFocus: handleCursorChange,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
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

  if (shouldEnableAIAssistant) {
    return (
      <Box ref={containerRef}>
        <AIAssistantInput
          {...commonProps}
          modelConfig={modelConfig}
          enableFStringAutocomplete={enableFStringAutocomplete}
          stateVariableOptions={stateVariableOptions}
        />
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
  }

  return (
    <Box ref={containerRef}>
      <Input.StyledInputEnhancer
        {...commonProps}
        multiline={variable === 'chat_history'}
      />
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

  // Determine if AI Assistant should be enabled for this field
  // - LLM node: system and task fields (only when field types are "f-string" or "fixed")
  // - Code node: code field (only when field types are "f-string" or "fixed")
  // - Printer node: text field (only when field types are "f-string" or "fixed")
  const shouldEnableAIAssistant =
    enableAIAssistant &&
    (type === 'fstring' || type === 'fixed') &&
    (variableName === 'system' ||
      variableName === 'task' ||
      variableName === 'code' ||
      variableName === 'printer');

  const enableFStringAutocomplete = type === 'fstring';

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
  container: {
    marginBottom: '1rem',
  },
  label: {
    marginBottom: '0.5rem',
  },
  fieldRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  typeSelectWrapper: {
    width: '7.25rem',
    paddingTop: '0.6rem',
  },
  valueWrapper: {
    flex: 1,
    marginTop: !isStringType ? '0.625rem' : undefined,
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
