import { useCallback, useEffect, useState } from 'react';

import { Autocomplete, Chip, InputAdornment, TextField, Typography } from '@mui/material';
import { Box } from '@mui/system';

import { MenuItemIcon } from '@/[fsd]/shared/ui/select';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import { filterProps } from '@/common/utils';
import UserAvatar from '@/components/UserAvatar';
import styled from '@emotion/styled';

export const StyledAutocomplete = styled(Autocomplete)(() => ({
  '& .MuiAutocomplete-option': {
    margin: 0,
  },
}));

const StyledChip = styled(Chip)(() => ({
  height: '24px',
  margin: '0px !important',
  '& .MuiChip-label': {
    paddingLeft: '8px', // Reduce left padding (default is usually 12px)
    paddingRight: '8px', // Reduce right padding (default is usually 12px)
  },
}));

const StyledLi = styled(
  'li',
  filterProps('selected', 'selectedBackground', 'hoverBackgroundColor'),
)(({ selected, selectedBackground, hoverBackgroundColor }) => ({
  height: '40px',
  padding: '8px 20px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between !important',
  alignItems: 'center',
  backgroundColor: selected ? selectedBackground : 'transparent',
  '&:hover': {
    backgroundColor: hoverBackgroundColor,
  },
}));

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
  slotProps = {
    Chip: {
      sx: {},
    },
    RemoveIcon: {
      fill: 'currentColor',
    },
    Li: {
      selectedBackground: 'transparent',
      hoverBackgroundColor: 'transparent',
      CheckIcon: {
        fill: 'currentColor',
      },
    },
    paper: {
      sx: {},
    },
    listbox: {
      ref: null,
      onScroll: null,
      style: {},
    },
    input: {},
  },
  slots = {
    SearchIcon: undefined,
  },
  ...props
}) {
  const [options, setOptions] = useState(selectedOptions);

  useEffect(() => {
    setOptions(selectedOptions);
  }, [selectedOptions]);

  // options is used to store the current list of options in the dropdown
  // selectedOptions is the initial list of options passed to the component
  // selectedOptions is used to set the initial state of options when the component mounts
  // options is updated when the user adds or removes options
  // selectedOptions is not updated when the user adds or removes options, it remains the same
  // onChange is called with the updated options when the user adds or removes options
  // onChange is a callback function that is called when the options are updated
  // onChange is used to notify the parent component about the changes in options
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
                gap="4px"
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
            sx={slotProps.Chip.sx}
            deleteIcon={<RemoveIcon fill={slotProps.RemoveIcon.fill} />}
            {...optionPropsWithoutKey}
            onDelete={() => handleDelete(option)}
          />
        );
      }),
    [avatarField, handleDelete, nameField, slotProps.Chip.sx, slotProps.RemoveIcon.fill],
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
                  ...(slotProps.input || {}),
                }
              : {
                  ...(params.InputProps || {}),
                  ...(slotProps.input || {}),
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
      slotProps.input,
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
      sx={{ marginTop: '0.5rem' }}
      slotProps={{
        paper: {
          sx: slotProps.paper.sx,
          display: optionList && optionList.length > 0 ? 'block' : 'none',
        },
        listbox: slotProps.listbox,
        popper: {
          placement: 'bottom-start',
          // Completely hide the popper when no options
          sx: {
            display: optionList && optionList.length > 0 ? 'block' : 'none !important',
          },
        },
      }}
      renderOption={(optionProps, option, state) => {
        const { key, ...otherOptionProps } = optionProps;
        return (
          <StyledLi
            key={key}
            {...otherOptionProps}
            selectedBackground={slotProps.Li.selectedBackground}
            hoverBackgroundColor={slotProps.Li.hoverBackgroundColor}
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
                <CheckedIcon
                  sx={{ fontSize: '16px' }}
                  fill={slotProps.Li.CheckIcon.fill}
                />
              </MenuItemIcon>
            )}
          </StyledLi>
        );
      }}
      {...props}
    />
  );
}
