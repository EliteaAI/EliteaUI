import { memo, useCallback, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useInputOptions } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { LabelWithTooltip } from '@/[fsd]/features/pipelines/flow-editor/ui/settings/InputMappings';
import { useFStringInputAutocomplete } from '@/[fsd]/features/pipelines/fstring-autocomplete/lib/hooks';
import { FStringAutocompletePopper } from '@/[fsd]/features/pipelines/fstring-autocomplete/ui';
import { Checkbox, Chip, Input, Select } from '@/[fsd]/shared/ui';

const DATA_TYPE_CONFIG = {
  boolean: { placeholder: '' },
  integer: { placeholder: 'input number', inputType: 'number' },
  number: { placeholder: 'input number', inputType: 'number' },
  object: { placeholder: '{}' },
  array: { placeholder: '[]' },
  string: { placeholder: '' },
};

const getDisplayValue = val => (typeof val === 'object' && val !== null ? JSON.stringify(val) : val);

const BooleanField = memo(props => {
  const { value, onChange, disabled, tooltip } = props;

  return (
    <FormControlLabel
      control={
        <Checkbox.BaseCheckbox
          checked={value === true}
          onChange={onChange}
          disabled={disabled}
          size="large"
        />
      }
      label={<LabelWithTooltip tooltip={<Typography variant="labelSmall">{tooltip}</Typography>} />}
      sx={styles.formControlLabel}
      className="nopan nodrag"
      labelPlacement="start"
    />
  );
});

BooleanField.displayName = 'BooleanField';

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

const InputMappingItem = memo(props => {
  const {
    variableName,
    type,
    dataType,
    value,
    enumList,
    variable,
    onChangeMapping,
    disabled,
    tooltip,
    defaultValues,
    mappingInfo,
  } = props;
  const inputOptions = useInputOptions();
  const isStringType = type === 'string' || type === 'fstring' || type === 'fixed';
  const typeOptions = useMemo(
    () =>
      FlowEditorConstants.agentTaskTypeOptions.filter(
        option => option.value !== 'fstring' || variable !== 'chat_history',
      ),
    [variable],
  );
  const onChangeType = useCallback(
    newType => {
      // Preserve value when switching between 'fstring' and 'fixed'
      // Clear value when switching to/from 'variable'
      const enumListForNewType = FlowEditorHelpers.getEnumList(
        newType,
        mappingInfo[variable]?.enum,
        inputOptions,
      );
      const defaultValue = FlowEditorHelpers.getInputMappingDefaultValue(
        enumListForNewType,
        newType !== 'variable' ? dataType : 'string',
        defaultValues,
        variable,
      );
      const shouldPreserveValue =
        (type === 'fstring' && newType === 'fixed') || (type === 'fixed' && newType === 'fstring');
      const newValue = shouldPreserveValue ? value : defaultValue;
      const formattedValue =
        newType === 'fstring'
          ? (() => {
              try {
                return typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
              } catch {
                return String(newValue);
              }
            })()
          : newValue;
      onChangeMapping(
        variable,
        {
          type: newType,
          value: formattedValue,
        },
        dataType,
      );
    },
    [mappingInfo, variable, inputOptions, dataType, defaultValues, type, value, onChangeMapping],
  );

  const onChangeValue = useCallback(
    newValue => {
      onChangeMapping(
        variable,
        {
          type,
          value: newValue,
          ...(enumList?.length ? { enum: enumList } : {}),
        },
        dataType,
      );
    },
    [variable, type, onChangeMapping, dataType, enumList],
  );

  const onInput = useCallback(
    event => {
      event.preventDefault();
      if (dataType === 'object' || dataType === 'array') {
        try {
          const parsedValue = JSON.parse(event.target.value);
          onChangeValue(parsedValue);
          return;
        } catch {
          onChangeValue(event.target.value);
        }
      } else {
        onChangeValue(event.target.value);
      }
    },
    [dataType, onChangeValue],
  );

  const onBooleanChange = useCallback(
    event => {
      onChangeValue(event.target.checked);
    },
    [onChangeValue],
  );

  const onNumberInput = useCallback(
    event => {
      event.preventDefault();
      const newValue = event.target.value;
      const numValue = dataType === 'integer' ? parseInt(newValue, 10) : parseFloat(newValue);
      onChangeValue(isNaN(numValue) ? newValue : numValue);
    },
    [onChangeValue, dataType],
  );

  const renderDataTypeField = useMemo(() => {
    if (!isStringType) return null;

    const config = DATA_TYPE_CONFIG[dataType] || DATA_TYPE_CONFIG.string;

    if (dataType === 'boolean' && type === 'fixed') {
      return (
        <BooleanField
          value={value}
          onChange={onBooleanChange}
          disabled={disabled}
          tooltip={`Value of ${dataType} type is expected`}
        />
      );
    }

    if (dataType === 'integer' || dataType === 'number') {
      return (
        <TextInputField
          value={'' + value}
          onInput={onNumberInput}
          disabled={disabled}
          tooltip={`Value of ${dataType} type is expected`}
          placeholder={config.placeholder}
          inputType={config.inputType}
        />
      );
    }

    const showTitle = dataType === 'object' || dataType === 'array';
    const isMultiline = mappingInfo[variable]?.multiline === true;
    return (
      <TextInputField
        value={
          typeof value !== 'string' &&
          (dataType === 'string' || dataType === 'object' || dataType === 'array' || dataType === 'boolean')
            ? JSON.stringify(value)
            : value
        }
        onInput={onInput}
        disabled={disabled}
        tooltip={`Value of ${dataType} type is expected`}
        placeholder={config.placeholder}
        showTitle={showTitle}
        language={dataType === 'object' || dataType === 'array' ? 'json' : undefined}
        multiline={isMultiline}
        enableFStringAutocomplete={type === 'fstring'}
        stateVariableOptions={inputOptions}
      />
    );
  }, [
    isStringType,
    dataType,
    type,
    value,
    onInput,
    disabled,
    onBooleanChange,
    onNumberInput,
    mappingInfo,
    variable,
    inputOptions,
  ]);

  const enumOptions = useMemo(() => {
    return enumList?.map(item => ({ label: item, value: item })) || [];
  }, [enumList]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.labelRow}>
        <Chip.HeadingChip label={variableName} />
        {tooltip && (
          <LabelWithTooltip
            tooltip={tooltip}
            title=""
          />
        )}
      </Box>
      <Box sx={styles.fieldRow}>
        <Box sx={styles.typeSelectWrapper}>
          <Select.SingleSelect
            sx={styles.select}
            label="Type"
            value={type}
            onValueChange={onChangeType}
            options={typeOptions}
            disabled={disabled}
            showBorder
            className="nopan nodrag"
          />
        </Box>
        <Box sx={styles.valueWrapper}>
          {enumList?.length ? (
            dataType !== 'array' || type === 'variable' ? (
              <Select.SingleSelect
                sx={styles.select}
                label={<LabelWithTooltip tooltip="Select one option" />}
                value={value}
                onValueChange={onChangeValue}
                options={enumOptions}
                disabled={disabled}
                showBorder
                className="nopan nodrag"
                labelSX={styles.labelSX}
              />
            ) : (
              <Select.SingleSelect
                label={<LabelWithTooltip tooltip="Select options" />}
                onValueChange={onChangeValue}
                value={value}
                options={enumOptions}
                multiple
                showBorder
                className="nopan nodrag"
              />
            )
          ) : isStringType ? (
            renderDataTypeField
          ) : (
            <Select.SingleSelect
              sx={styles.select}
              label={<LabelWithTooltip tooltip="Select one option" />}
              value={value}
              onValueChange={onChangeValue}
              options={inputOptions}
              disabled={disabled}
              showBorder
              className="nopan nodrag"
              labelSX={styles.labelSX}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
});

InputMappingItem.displayName = 'InputMappingItem';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: '1rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  },
  fieldRow: {
    marginTop: '1rem',
    display: 'flex',
    gap: '1.1875rem',
    width: '100%',
    alignItems: 'flex-end',
    height: '2.8125rem',
  },
  typeSelectWrapper: {
    width: '7.25rem',
  },
  valueWrapper: {
    flex: 1,
  },
  select: {
    marginBottom: '0rem',
  },
  labelSX: {
    pointerEvents: 'auto',
    zIndex: 500,
  },
  formControlLabel: {
    marginLeft: 0,
    height: '2.8125rem',
    alignItems: 'center',
  },
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

export default InputMappingItem;
