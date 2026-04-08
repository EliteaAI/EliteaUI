import { useCallback, useEffect, useMemo, useState } from 'react';

import { Autocomplete, Box, Chip, InputAdornment, ListItemIcon, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { styled as muiStyled } from '@mui/material/styles';

import CheckedIcon from '@/assets/checked-icon.svg?react';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import UserAvatar from '@/components/UserAvatar';
import styled from '@emotion/styled';

const MenuItemIcon = muiStyled(ListItemIcon)(() => ({
  width: '0.625rem',
  height: '0.625rem',
  fontSize: '0.625rem',
  marginRight: '0.6rem',
  minWidth: '0.625rem !important',
  svg: {
    fontSize: '0.625rem',
  },
}));

export const StyledAutocomplete = styled(Autocomplete)(() => ({
  '& .MuiAutocomplete-option': {
    margin: 0,
  },
}));

const StyledChip = styled(Chip)(() => ({
  '& .MuiChip-label': {
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
  },
}));

const defaultFilterOptions = createFilterOptions();

const normalizeSx = sx => {
  if (sx == null) return [];
  return Array.isArray(sx) ? sx : [sx];
};

export default function AutoCompleteDropDown({
  optionList = [],
  selectedOptions,
  onChangedSelectedOptions,
  disabled,
  label = 'label',
  displayName = 'value',
  placeholder = '',
  initialValue = {},
  onValidate,
  maxValueLength = 48,
  multipleValueValidationRegExp = /.*?/g,
  singleValueValidationRegExp = /.*?/g,
  nameField = 'name',
  idField = 'id',
  avatarField = '',
  canInputNewValues = true,
  useInitialValue = true,
  showSearchIcon = false,
  ignoreCase = true,
  renderOptionBody = undefined,
  slotProps: slotPropsProp = {},
  slots = {
    SearchIcon: undefined,
  },
  sx,
  filterOptions: filterOptionsProp,
  ...props
}) {
  const filterFn = filterOptionsProp ?? defaultFilterOptions;
  const [options, setOptions] = useState(selectedOptions);

  const styles = useMemo(() => autoCompleteDropDownStyled(slotPropsProp), [slotPropsProp]);

  useEffect(() => {
    setOptions(selectedOptions);
  }, [selectedOptions]);

  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);
  const [helpText, setHelpText] = useState('');

  const onSetNewOptions = useCallback(
    newOptions => {
      const uniqueOptions = newOptions.filter(option =>
        canInputNewValues ? true : optionList.some(item => item[idField] === option[idField]),
      );
      setOptions(uniqueOptions);

      if (onChangedSelectedOptions) {
        onChangedSelectedOptions(
          uniqueOptions.map(option =>
            useInitialValue
              ? { [nameField]: option[nameField], ...initialValue }
              : optionList.find(item => item[idField] === option[idField]) || {
                  [nameField]: option[nameField],
                },
          ),
        );
      }
    },
    [
      canInputNewValues,
      idField,
      initialValue,
      nameField,
      onChangedSelectedOptions,
      optionList,
      useInitialValue,
    ],
  );

  const onAddNewOptions = useCallback(
    value => {
      const newOption = value.trim();
      if (newOption) {
        onSetNewOptions([...options, { [nameField]: newOption, [idField]: newOption, isNew: true }]);
      }
      setInputValue('');
    },
    [idField, nameField, onSetNewOptions, options],
  );

  const handleInputChange = useCallback(
    event => {
      const value = event.target.value;
      if (value.match(multipleValueValidationRegExp) && value.indexOf(',') >= 0) {
        const newOptions = value
          .split(',')
          .map(option => option.trim().substring(0, maxValueLength))
          .filter(
            option =>
              option.length > 0 &&
              option.match(multipleValueValidationRegExp) &&
              !options.find(item =>
                ignoreCase
                  ? item[nameField].toLowerCase() === option.toLowerCase()
                  : item[nameField] === option,
              ),
          )
          .map(option => ({ [nameField]: option, [idField]: option, isNew: true }));
        onSetNewOptions([...options, ...newOptions]);
        setInputValue('');
        setError(false);
        setHelpText('');
        event.target.value = '';
        return;
      } else if (value) {
        setError(!value.match(multipleValueValidationRegExp));
        onValidate?.(value, setHelpText);
      } else {
        setError(false);
        setHelpText('');
      }
      setInputValue(value.substring(0, maxValueLength));
    },
    [
      multipleValueValidationRegExp,
      maxValueLength,
      onSetNewOptions,
      options,
      ignoreCase,
      nameField,
      idField,
      onValidate,
    ],
  );

  const onClickOption = useCallback(
    (selected, value) => () => {
      if (selected) {
        onSetNewOptions([...options, value]);
        setInputValue('');
      } else {
        onSetNewOptions(options.filter(option => option[idField] !== value[idField]));
      }
    },
    [idField, onSetNewOptions, options],
  );

  const handleDelete = useCallback(
    optionToDelete => {
      onSetNewOptions(options.filter(option => option[idField] !== optionToDelete[idField]));
    },
    [onSetNewOptions, options, idField],
  );

  const onBlur = useCallback(
    event => {
      const value = event.target.value;
      if (value && value.match(singleValueValidationRegExp) && value.length > 0) {
        onAddNewOptions(value);
      }
    },
    [onAddNewOptions, singleValueValidationRegExp],
  );

  const renderValue = useCallback(
    (value, getOptionProps) =>
      value.map((option, index) => {
        const optionProps = getOptionProps({ index });
        // eslint-disable-next-line no-unused-vars
        const { key: notUsedKey, ...optionPropsWithoutKey } = optionProps;
        return (
          <StyledChip
            label={
              <Box
                height={'100%'}
                display={'flex'}
                alignItems={'center'}
                flexDirection="row"
                gap="0.25rem"
              >
                {avatarField && (
                  <UserAvatar
                    name={option[nameField]}
                    avatar={option[avatarField]}
                    size={16}
                  />
                )}
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  {option[nameField]}
                </Typography>
              </Box>
            }
            key={index}
            sx={styles.mergedChipSx}
            deleteIcon={<RemoveIcon fill={styles.mergedRemoveIcon.fill} />}
            {...optionPropsWithoutKey}
            onDelete={() => handleDelete(option)}
          />
        );
      }),
    [avatarField, handleDelete, nameField, styles.mergedChipSx, styles.mergedRemoveIcon.fill],
  );
  const renderInput = useCallback(
    params => (
      <TextField
        {...params}
        fullWidth
        variant="standard"
        label={label}
        placeholder={
          disabled || options.length
            ? ''
            : placeholder || `Type a ${displayName.toLowerCase()} and press comma/enter`
        }
        value={inputValue}
        error={error}
        helperText={error ? helpText : ''}
        onChange={handleInputChange}
        onBlur={onBlur}
        sx={{
          '& .MuiInputLabel-shrink': {
            top: '0.375rem',
          },
        }}
        slotProps={{
          input:
            options.length || inputValue
              ? {
                  ...(params.InputProps || {}),
                  ...styles.inputSlotProps,
                }
              : {
                  ...(params.InputProps || {}),
                  ...styles.inputSlotProps,
                  startAdornment: showSearchIcon ? (
                    <InputAdornment
                      sx={{ marginRight: '0px' }}
                      position="start"
                    >
                      {slots.SearchIcon}
                    </InputAdornment>
                  ) : null,
                },
        }}
      />
    ),
    [
      disabled,
      displayName,
      error,
      handleInputChange,
      helpText,
      inputValue,
      label,
      onBlur,
      options.length,
      placeholder,
      showSearchIcon,
      styles.inputSlotProps,
      slots.SearchIcon,
    ],
  );

  const onChangeMulti = useCallback(
    (event, newValue) => {
      const filterNewValues = Array.isArray(newValue)
        ? newValue
            .filter(option => typeof option !== 'string' || !!option.match(singleValueValidationRegExp))
            .map(option => (typeof option === 'string' ? { [nameField]: option } : option))
        : typeof newValue === 'string' && newValue.match(singleValueValidationRegExp)
          ? [{ [nameField]: newValue }]
          : [];
      setError(false);
      onSetNewOptions(filterNewValues);
      setInputValue('');
    },
    [nameField, onSetNewOptions, singleValueValidationRegExp],
  );

  const getOptionLabel = useCallback(
    option => {
      if (typeof option === 'string') {
        return option;
      }
      return option[nameField] || '';
    },
    [nameField],
  );

  const isOptionEqualToValue = useCallback(
    (option, value) => {
      if (typeof option === 'string' && typeof value === 'string') {
        return option === value;
      }
      if (typeof option === 'object' && typeof value === 'object') {
        return option[idField] === value[idField];
      }
      if (typeof option === 'string' && typeof value === 'object') {
        return option === value[nameField];
      }
      if (typeof option === 'object' && typeof value === 'string') {
        return option[nameField] === value;
      }
      return false;
    },
    [idField, nameField],
  );

  const filteredOptionsCount = useMemo(
    () => filterFn(optionList || [], { inputValue, getOptionLabel }).length,
    [filterFn, optionList, inputValue, getOptionLabel],
  );

  const showSuggestionsPopper = (optionList?.length ?? 0) > 0 && filteredOptionsCount > 0;

  return (
    <StyledAutocomplete
      multiple
      id="options-filled"
      options={optionList || []}
      freeSolo
      value={options}
      defaultValue={[]}
      disabled={disabled}
      inputValue={inputValue}
      onChange={onChangeMulti}
      onInput={handleInputChange}
      renderValue={renderValue}
      renderInput={renderInput}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      filterOptions={filterFn}
      slotProps={{
        paper: {
          sx: [
            { display: showSuggestionsPopper ? 'block' : 'none' },
            styles.paperDefaultSx,
            ...normalizeSx(slotPropsProp.paper?.sx),
          ],
        },
        listbox: styles.listboxProps,
        popper: {
          placement: 'bottom-start',
          sx: {
            display: showSuggestionsPopper ? 'block' : 'none !important',
          },
        },
      }}
      sx={[styles.rootAutocompleteSx, sx].filter(Boolean)}
      renderOption={(optionProps, option, state) => {
        const { key, ...otherOptionProps } = optionProps;
        return (
          <Box
            component="li"
            key={key}
            {...otherOptionProps}
            sx={({ palette }) => styles.getOptionLiSx(state.selected, palette)}
            onClick={onClickOption(!state.selected, option)}
          >
            {renderOptionBody ? (
              renderOptionBody(option, state)
            ) : (
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                {option[nameField]}
              </Typography>
            )}
            {state.selected && (
              <MenuItemIcon>
                <CheckedIcon sx={styles.checkIconSx} />
              </MenuItemIcon>
            )}
          </Box>
        );
      }}
      {...props}
    />
  );
}

const autoCompleteDropDownStyled = slotPropsProp => ({
  mergedRemoveIcon: {
    fill: 'currentColor',
    ...slotPropsProp.RemoveIcon,
  },
  mergedChipSx: [
    ({ palette }) => ({
      height: '1.5rem',
      margin: '0 !important',
      backgroundColor: palette.background.tagChip.disabled,
      '& .MuiChip-deleteIcon': {
        color: palette.icon.tagChip.default,
        marginLeft: 0,
      },
      '&:not(.Mui-disabled) .MuiChip-deleteIcon:hover': {
        color: palette.icon.tagChip.hover,
      },
    }),
    slotPropsProp.Chip?.sx,
  ].filter(Boolean),
  paperDefaultSx: ({ palette }) => ({
    background: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    boxShadow: palette.boxShadow.default,
    borderRadius: '0.5rem',
    margin: '0.5rem !important',
  }),
  listboxProps: slotPropsProp.listbox ?? {
    ref: null,
    onScroll: null,
    style: {},
  },
  inputSlotProps: slotPropsProp.input ?? {},
  rootAutocompleteSx: {
    marginTop: '0.25rem',
    '& .MuiAutocomplete-inputRoot': {
      flexWrap: 'wrap',
      gap: '0.25rem',
    },
  },
  getOptionLiSx: (selected, palette) => {
    const activeBg = slotPropsProp.Li?.selectedBackground ?? palette.background.participant.active;
    const hoverBg = slotPropsProp.Li?.hoverBackgroundColor ?? palette.background.participant.hover;
    return {
      height: '2.5rem',
      padding: '0.5rem 1.25rem',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between !important',
      alignItems: 'center',
      margin: 0,
      backgroundColor: selected ? activeBg : 'transparent',
      '&:hover': {
        backgroundColor: hoverBg,
      },
    };
  },
  checkIconSx: ({ palette }) => ({
    fontSize: '1rem',
    fill: slotPropsProp.Li?.CheckIcon?.fill ?? palette.icon.fill.secondary,
  }),
});
