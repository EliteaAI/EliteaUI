import { memo } from 'react';

import { Box } from '@mui/material';

import { LabelWithTooltip } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/InputMappings';
import { useFStringInputAutocomplete } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/hooks';
import { FStringAutocompletePopper } from '@/[fsd]/features/pipelines/fstring-autocomplete/ui';
import { Input } from '@/[fsd]/shared/ui';

const getDisplayValue = val => (typeof val === 'object' && val !== null ? JSON.stringify(val) : val);

const TextInputField = memo(props => {
  const {
    value,
    onInput,
    disabled,
    tooltip,
    placeholder,
    inputType = 'text',
    showTitle = false,
    language,
    multiline = false,
    enableFStringAutocomplete = false,
    stateVariableOptions = [],
    dataTestId,
  } = props;

  const resolvedValue = getDisplayValue(value) ?? '';

  const {
    autocompleteState,
    closeAutocomplete,
    containerRef,
    filteredOptions: filteredStateVariableOptions,
    handleAutocompleteKeyDown,
    handleChange,
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

  const popperSx = textInputFieldPopperStyles(containerRef.current?.clientWidth);

  return (
    <Box ref={containerRef}>
      <Input.StyledInputEnhancer
        autoComplete="off"
        multiline={multiline}
        maxRows={multiline ? 3 : undefined}
        disabled={disabled}
        variant="standard"
        fullWidth
        type={inputType}
        name="value"
        label={
          <LabelWithTooltip
            tooltip={tooltip}
            title={showTitle ? 'Value' : undefined}
          />
        }
        placeholder={placeholder}
        value={resolvedValue}
        onChange={handleChange}
        onBlur={closeAutocomplete}
        onClick={handleCursorChange}
        onFocus={handleCursorChange}
        onKeyDown={handleAutocompleteKeyDown}
        onKeyUp={handleCursorChange}
        hasActionsToolBar
        showCopyAction={false}
        showExpandAction={false}
        fieldName="value"
        containerProps={styles.inputContainerProps}
        InputLabelProps={styles.inputLabelProps}
        language={language}
        inputRef={inputRef}
        enableFStringAutocomplete={enableFStringAutocomplete}
        stateVariableOptions={stateVariableOptions}
        inputProps={dataTestId ? { 'data-testid': dataTestId } : undefined}
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

TextInputField.displayName = 'TextInputField';

/** @type {MuiSx} */
const styles = {
  inputContainerProps: {
    marginBottom: '0rem !important',
    className: 'nopan nodrag nowheel',
    boxSizing: 'border-box',
  },
  inputLabelProps: {
    style: { pointerEvents: 'auto', zIndex: 500 },
  },
};

/** @type {MuiSx} */
const textInputFieldPopperStyles = anchorWidth => ({
  width: anchorWidth || undefined,
});

export default TextInputField;
