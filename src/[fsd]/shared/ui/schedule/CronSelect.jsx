import { memo, useCallback } from 'react';

import { Autocomplete, Box, TextField, Typography } from '@mui/material';

import CheckedIcon from '@/assets/checked-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

const isOptionEqualToValue = (option, val) => option.value === val.value;

const CronSelect = memo(props => {
  const {
    value,
    options,
    onChange,
    error = false,
    sx,
    allowDeselect = false,
    allowEmpty = true,
    placeholder = '',
    multiple = false,
    'data-testid': dataTestId,
  } = props;

  const handleChange = useCallback(
    (_event, newVal) => {
      onChange(newVal);
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (_event, newInputValue, reason) => {
      if (!multiple && allowEmpty && (reason === 'clear' || (reason === 'input' && newInputValue === ''))) {
        onChange(null);
      }
    },
    [onChange, allowEmpty, multiple],
  );

  const multipleValue = multiple ? (value ?? []) : value;

  return (
    <Autocomplete
      data-testid={dataTestId}
      multiple={multiple}
      value={multipleValue}
      options={options}
      getOptionLabel={o => o.label}
      onChange={handleChange}
      onInputChange={handleInputChange}
      filterOptions={x => x}
      isOptionEqualToValue={isOptionEqualToValue}
      disableClearable
      disableCloseOnSelect={multiple}
      size="small"
      popupIcon={<ArrowDownIcon />}
      sx={[selectBaseSx, multiple && multipleExtraSx, error && selectErrorSx, sx]}
      slotProps={{
        paper: {
          sx: ({ palette }) => ({
            background: palette.background.secondary,
            border: `0.0625rem solid ${palette.border.lines}`,
            boxShadow: palette.boxShadow.default,
            borderRadius: '0.5rem',
            marginTop: '0.5rem',
          }),
        },
        listbox: {
          style: { padding: 0 },
        },
      }}
      renderTags={selected =>
        selected.length > 0 ? (
          <Typography
            variant="labelMedium"
            color="text.secondary"
            noWrap
            sx={{ maxWidth: '100%', paddingLeft: '0.5rem' }}
          >
            {selected.map(o => o.label).join(', ')}
          </Typography>
        ) : null
      }
      renderOption={(optionProps, option, optionState) => {
        const { key, ...rest } = optionProps;
        const handleClick =
          !multiple && allowDeselect && optionState.selected ? () => onChange(null) : rest.onClick;
        return (
          <Box
            component="li"
            key={key}
            {...rest}
            onClick={handleClick}
            sx={({ palette }) => ({
              justifyContent: 'space-between !important',
              alignItems: 'center',
              padding: '0.5rem 1rem !important',
              background: optionState.selected
                ? `${palette.background.participant.active} !important`
                : 'transparent',
              '&:hover': {
                background: `${palette.background.participant.hover} !important`,
              },
            })}
          >
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              {option.label}
            </Typography>
            {optionState.selected && (
              <CheckedIcon style={{ width: '1rem', height: '1rem', flexShrink: 0, marginLeft: '1rem' }} />
            )}
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          size="small"
          error={error}
          placeholder={multipleValue?.length === 0 || multipleValue === null ? placeholder : ''}
        />
      )}
    />
  );
});

CronSelect.displayName = 'CronSelect';

const selectBaseSx = {
  flexShrink: 0,
  '&.MuiAutocomplete-hasPopupIcon .MuiOutlinedInput-root': {
    paddingRight: '2rem !important',
  },
  '& .MuiAutocomplete-input': {
    padding: '0.25rem 0 0.25rem 0.75rem !important',
  },
  '& .MuiAutocomplete-endAdornment': {
    right: '0.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '& .MuiAutocomplete-popupIndicator': {
    padding: '0.125rem',
  },
};

const multipleExtraSx = {
  '& .MuiOutlinedInput-root': {
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  '& .MuiAutocomplete-input': {
    minWidth: '0 !important',
    width: '0 !important',
    padding: '0 !important',
  },
};

const selectErrorSx = {};

export default CronSelect;
