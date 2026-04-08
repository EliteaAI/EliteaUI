import { useCallback, useRef } from 'react';

import {
  Box,
  FormControl,
  FormHelperText,
  Input,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from '@mui/material';
import { styled as muiStyled } from '@mui/material/styles';

import { typographyVariants } from '@/MainTheme';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import { GROUP_SELECT_VALUE_SEPARATOR } from '@/common/constants';
import { debounce, filterProps } from '@/common/utils';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

import { StyledCircleProgress } from './Chat/StyledComponents';
import ArrowDownIcon from './Icons/ArrowDownIcon';
import SearchIcon from './Icons/SearchIcon';
import { StyledListSubheader } from './SearchBarComponents';
import StyledSelect from './StyledSelect';

const StyledFormControl = muiStyled(
  FormControl,
  filterProps('showBorder'),
)(({ theme, showBorder }) =>
  showBorder
    ? {
        '& .MuiSelect-icon': {
          marginRight: '.75rem',
        },
        verticalAlign: 'bottom',

        '& .MuiInputBase-root.MuiInput-root': {
          padding: '0 .75rem',

          '&:not(:hover, .Mui-error):before': {
            borderBottom: `.0625rem solid ${theme.palette.border.lines}`,
          },

          '&:hover:not(.Mui-disabled, .Mui-error):before': {
            borderBottom: `.125rem solid ${theme.palette.border.hover}`,
          },
        },

        '& .MuiFormHelperText-root.Mui-error': {
          paddingLeft: '.75rem',
        },
      }
    : {
        margin: '0 8px',
        verticalAlign: 'bottom',
        '& .MuiInputBase-root.MuiInput-root:before': {
          border: 'none',
        },
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            border: 'none',
          },
          '&:hover fieldset': {
            border: 'none',
          },
          '&.Mui-focused fieldset': {
            border: 'none',
          },
          '& .MuiFormHelperText-root.Mui-error': {
            paddingLeft: '.75rem',
          },
        },
      },
);

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

const StyledMenuItemIcon = muiStyled(MenuItemIcon)(() => ({
  justifySelf: 'flex-end',
  justifyContent: 'flex-end',
  marginRight: '0rem',
  marginLeft: '1rem',

  svg: {
    fontSize: '0.75rem',
  },
}));

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

const splitValue = value => {
  const splittedValue = value.split(GROUP_SELECT_VALUE_SEPARATOR);
  return {
    type: splittedValue[0],
    value: splittedValue[1],
  };
};

export default function GroupedMultipleSelect({
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
  required,
  error,
  helperText,
  fullWidth = true,
  onLoadMore,
  isLoading,
  shrinkLabel = false,
  canLoadMore = false,
  disabled,
  withSearch = false,
  onSearch,
  searchString = '',
}) {
  const theme = useTheme();
  const styles = groupedMultipleSelectStyles();
  const searchInputRef = useRef(null);
  const handleFocus = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  // auto suggest list items interactions
  const handleInputChange = useCallback(
    event => {
      event.stopPropagation();
      const newInputValue = event.target.value;
      onSearch && onSearch(newInputValue);
    },
    [onSearch],
  );

  // search logics
  const onKeyDown = useCallback(
    event => {
      event.stopPropagation();
      onSearch(searchString);
    },
    [onSearch, searchString],
  );
  const onFocus = useCallback(event => {
    event.stopPropagation();
  }, []);
  const realValue = value.map(item => item.type + GROUP_SELECT_VALUE_SEPARATOR + item.value);
  const groupedOptions = options.reduce((acc, obj) => {
    const key = obj.type;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  const handleChange = useCallback(
    event => {
      if ((!multiple && event.target.value) || (multiple && event.target.value.every(it => it))) {
        onValueChange(
          multiple ? event.target.value.map(item => splitValue(item)) : [splitValue(event.target.value)],
        );
      }
    },
    [multiple, onValueChange],
  );

  const renderValue = useCallback(
    selectedValue => {
      const foundOptions = options
        .filter(
          ({ value: itemValue, type: itemType }) =>
            !!selectedValue
              .map(item => splitValue(item))
              .find(selectedItem => selectedItem.value == itemValue && selectedItem.type === itemType),
        )
        .map(item => item.type + '::' + item.label);
      return foundOptions.length ? (
        <ValueItem>{customRenderValue ? customRenderValue(foundOptions) : foundOptions.join(',')}</ValueItem>
      ) : (
        <ValueItem>{emptyPlaceHolder}</ValueItem>
      );
    },
    [customRenderValue, emptyPlaceHolder, options],
  );

  const handleScroll = debounce(event => {
    const bottomReached =
      event.target.scrollHeight - event.target.scrollTop <= event.target.clientHeight + 40;
    if (bottomReached) {
      // eslint-disable-next-line no-console
      console.debug('bottomReached=====>');
      if (canLoadMore) {
        onLoadMore && onLoadMore();
      }
    }
  }, 400);

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
        labelId={id ? id + '-label' : 'simple-select-label-' + label}
        id={id || 'simple-select-' + label}
        name={name}
        MenuProps={{
          PaperProps: { style: { maxHeight: 400, maxWidth: 300, marginTop: '4px' }, onScroll: handleScroll },
          MenuListProps: {
            style: { paddingTop: '0px', paddingBottom: '0px' },
          },
        }}
        value={options && options.length ? realValue : []}
        onChange={handleChange}
        IconComponent={ArrowDownIcon}
        customSelectedColor={customSelectedColor}
        customSelectedFontSize={customSelectedFontSize}
        displayEmpty={displayEmpty}
        renderValue={renderValue}
        disabled={disabled}
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
        onOpen={handleFocus}
      >
        {withSearch && (
          <StyledListSubheader
            disabled
            sx={{ padding: '0px 0px' }}
          >
            <FormControl sx={styles.searchInputContainer(theme)}>
              <Input
                ref={searchInputRef}
                sx={styles.searchInput}
                disableUnderline
                variant="standard"
                placeholder="Search for ..."
                value={searchString}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                autoFocus
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                }
              />
            </FormControl>
          </StyledListSubheader>
        )}
        {options.length < 1 ? (
          <MenuItem
            sx={{ justifyContent: 'space-between' }}
            value=""
          >
            <em>None</em>
          </MenuItem>
        ) : (
          Object.keys(groupedOptions).map(type => {
            return [
              <MenuItem
                disabled
                sx={{
                  justifyContent: 'space-between',
                  '&.Mui-disabled': {
                    color: theme.palette.text.secondary,
                    opacity: 1,
                  },
                }}
                key={type}
                value={'GroupedType'}
              >
                <Typography
                  variant="headingSmall"
                  sx={{
                    textTransform: 'capitalize',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {type}
                </Typography>
              </MenuItem>,
              ...groupedOptions[type].map(option => {
                return !showOptionIcon ? (
                  <MenuItem
                    disableRipple
                    sx={{
                      justifyContent: 'space-between',
                      width: '100%',
                      overflowX: 'scroll',
                      background: value.find(item => item.value == option.value && item.type === option.type)
                        ? theme.palette.background.participant.active
                        : undefined,
                    }}
                    key={option.type + option.value}
                    value={option.type + GROUP_SELECT_VALUE_SEPARATOR + option.value}
                  >
                    <Typography
                      variant="bodyMedium"
                      sx={{ whiteSpaceCollapse: 'preserve' }}
                    >
                      {option.label}
                    </Typography>
                    {value.find(item => item.value == option.value && item.type === option.type) && (
                      <StyledMenuItemIcon>
                        <CheckedIcon />
                      </StyledMenuItemIcon>
                    )}
                  </MenuItem>
                ) : (
                  <MenuItem
                    disableRipple
                    sx={{ justifyContent: 'space-between', width: '100%', overflowX: 'scroll' }}
                    key={option.type + option.value}
                    value={option.type + GROUP_SELECT_VALUE_SEPARATOR + option.value}
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
                            sx={{ whiteSpaceCollapse: 'preserve' }}
                          >
                            {option.label}
                          </Typography>
                        }
                      />
                    </Box>
                    {value.find(item => item.value == option.value && item.type === option.type) && (
                      <StyledMenuItemIcon>
                        <CheckedIcon />
                      </StyledMenuItemIcon>
                    )}
                  </MenuItem>
                );
              }),
            ];
          })
        )}
        {isLoading && (
          <MenuItem
            sx={{ justifyContent: 'space-between' }}
            disabled
            value=""
          >
            <StyledCircleProgress
              size={20}
              sx={{ color: theme.palette.text.secondary }}
            />
          </MenuItem>
        )}
      </StyledSelect>
      <FormHelperText>{error ? helperText : ''}</FormHelperText>
    </StyledFormControl>
  );
}

const groupedMultipleSelectStyles = () => ({
  searchInputContainer: ({ palette }) => ({
    width: '100%',
    padding: '0.75rem 1.25rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  searchInput: {
    ...typographyVariants.bodyMedium,
  },
});
