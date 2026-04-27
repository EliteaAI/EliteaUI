import { useCallback, useMemo } from 'react';

import { Box, FormHelperText, InputLabel, ListItemText, MenuItem, Typography } from '@mui/material';

import { MenuItemIcon, StyledFormControl, StyledMenuItemIcon } from '@/[fsd]/shared/ui/select';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

import StyledTooltip from '../ComponentsLib/Tooltip';
import ArrowDownIcon from './Icons/ArrowDownIcon';
import StyledSelect from './StyledSelect';

const SELECT_ALL = 'SelectAll';
const UNSELECT_ALL = 'UnselectAll';

const ValueItem = styled(Box)(() => ({
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: '200px',
  wordWrap: 'break-word',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: '1',
  whiteSpaceCollapse: 'preserve',
}));

const SelectAllButton = styled(MenuItem)(({ theme }) => ({
  justifyContent: 'space-between',
  position: 'sticky',
  bottom: '-10px',
  height: '40px',
  background: theme.palette.background.secondary,
  color: theme.palette.background.button.primary.pressed,
  '&:hover': {
    background: theme.palette.background.secondary,
  },
}));

export default function MultipleSelect({
  value = [],
  label,
  options,
  onValueChange,
  displayEmpty = true,
  customSelectedColor,
  customSelectedFontSize,
  showOptionIcon = false,
  showBorder,
  multiple = true,
  sx,
  id,
  name,
  emptyPlaceHolder = 'All Statuses',
  customRenderValue,
  labelSX,
  selectSX,
  valueItemSX,
  required,
  error,
  helperText,
  fullWidth = true,
  shrinkLabel,
  MenuProps,
  disableUnderline = false,
  showSelectAll,
  disabled,
  showHelperText,
  className,
  onDeleteOption,
}) {
  const theme = useTheme();
  const hasSelectedValues = useMemo(() => value.length, [value.length]);
  const realValue = useMemo(() => (options && options.length ? value : []), [options, value]);
  const handleChange = useCallback(
    event => {
      if (multiple) {
        if (event.target.value.includes(SELECT_ALL)) {
          onValueChange(options.map(option => option.value));
        } else if (event.target.value.includes(UNSELECT_ALL)) {
          onValueChange([]);
        } else {
          onValueChange(event.target.value);
        }
      } else {
        onValueChange([event.target.value]);
      }
    },
    [multiple, onValueChange, options],
  );

  const renderValue = useCallback(
    selectedValue => {
      const foundOptions = options
        .filter(({ value: itemValue }) => !!selectedValue.find(selectedItem => selectedItem === itemValue))
        .map(item => item.label);
      return foundOptions.length ? (
        <ValueItem
          sx={valueItemSX}
          className={className}
        >
          {customRenderValue ? customRenderValue(foundOptions) : foundOptions.join(',')}
        </ValueItem>
      ) : (
        <ValueItem sx={valueItemSX}>{emptyPlaceHolder}</ValueItem>
      );
    },
    [className, customRenderValue, emptyPlaceHolder, options, valueItemSX],
  );

  return (
    <StyledFormControl
      sx={sx}
      variant="standard"
      size="small"
      fullWidth={fullWidth}
      showBorder={showBorder}
      required={required}
      error={error}
    >
      {label && (
        <InputLabel
          sx={{
            color: 'text.primary',
            fontSize: '14px',
            fontWeight: 400,
            top: value.length ? '0px' : '-6px',
            '&.Mui-focused': {
              top: '0px',
            },
            ...labelSX,
          }}
          shrink={shrinkLabel}
        >
          {label}
        </InputLabel>
      )}
      <StyledSelect
        className={className}
        disabled={disabled}
        labelId={id ? id + '-label' : 'simple-select-label-' + label}
        id={id || 'simple-select-' + label}
        name={name}
        value={realValue}
        onChange={handleChange}
        IconComponent={ArrowDownIcon}
        MenuProps={MenuProps}
        customSelectedColor={customSelectedColor}
        customSelectedFontSize={customSelectedFontSize}
        displayEmpty={displayEmpty}
        renderValue={renderValue}
        disableUnderline={disableUnderline}
        sx={{
          paddingTop: '7px !important',
          paddingBottom: '0  !important',
          '& .MuiSelect-icon': {
            top: 'calc(50% - 6px) !important;',
          },
          ...(selectSX || {}),
        }}
        multiple={multiple}
        label={label}
      >
        {options.length < 1 ? (
          <MenuItem
            sx={{ justifyContent: 'space-between' }}
            value=""
          >
            <em>None</em>
          </MenuItem>
        ) : (
          options.map(option => {
            return !showOptionIcon ? (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  justifyContent: 'space-between',
                  background: value.find(item => item === option.value)
                    ? theme.palette.background.participant.active
                    : undefined,
                }}
              >
                <StyledTooltip
                  key={option.value}
                  placement="top"
                  title={option.tooltip}
                >
                  <Typography
                    variant="bodyMedium"
                    color={!option.canDelete ? 'text.secondary' : theme.palette.status.rejected}
                    sx={{ whiteSpaceCollapse: 'preserve' }}
                  >
                    {option.label}
                  </Typography>
                </StyledTooltip>
                {!option.canDelete && value.find(item => item === option.value) && (
                  <StyledMenuItemIcon>
                    <CheckedIcon />
                  </StyledMenuItemIcon>
                )}
                {option.canDelete && (
                  <StyledTooltip
                    placement="top"
                    title={'Delete'}
                  >
                    <Box>
                      <RemoveIcon
                        fill={theme.palette.icon.fill.secondary}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => onDeleteOption(option.value)}
                      />
                    </Box>
                  </StyledTooltip>
                )}
              </MenuItem>
            ) : (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  justifyContent: 'space-between',
                  background: value.find(item => item === option.value)
                    ? theme.palette.background.participant.active
                    : undefined,
                }}
              >
                <StyledTooltip
                  placement="top"
                  title={option.tooltip}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <MenuItemIcon>{option.icon}</MenuItemIcon>
                    <ListItemText
                      variant="bodyMedium"
                      primary={
                        <Typography
                          variant="bodyMedium"
                          color={!option.canDelete ? 'text.secondary' : theme.palette.status.rejected}
                          sx={{ whiteSpaceCollapse: 'preserve' }}
                        >
                          {option.label}
                        </Typography>
                      }
                    />
                  </Box>
                </StyledTooltip>
                {!option.canDelete && value.find(item => item === option.value) && (
                  <StyledMenuItemIcon>
                    <CheckedIcon />
                  </StyledMenuItemIcon>
                )}
                {option.canDelete && (
                  <StyledTooltip
                    placement="top"
                    title={'Delete'}
                  >
                    <Box>
                      <RemoveIcon
                        fill={theme.palette.icon.fill.secondary}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => onDeleteOption(option.value)}
                      />
                    </Box>
                  </StyledTooltip>
                )}
              </MenuItem>
            );
          })
        )}
        {showSelectAll && (
          <SelectAllButton
            value={hasSelectedValues ? UNSELECT_ALL : SELECT_ALL}
            disableRipple
          >
            <Typography variant="labelMedium">
              {hasSelectedValues ? 'Clear selected' : 'Select all'}
            </Typography>
          </SelectAllButton>
        )}
      </StyledSelect>
      {showHelperText && <FormHelperText>{error ? helperText : ''}</FormHelperText>}
    </StyledFormControl>
  );
}
