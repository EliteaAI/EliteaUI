import { memo, useCallback, useMemo, useState } from 'react';

import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Banner } from '@/[fsd]/shared/ui';
import RemoveIcon from '@/assets/remove-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

import SingleSelectDropdown from './SingleSelectDropdown';
import { getSingleSelectShowBorderSx, getSingleSelectWithoutBorderSx } from './singleSelectVariants';

const DEFAULT_MAX_MENU_HEIGHT = '30rem';

const SingleSelect = memo(props => {
  const {
    value,
    label,
    options,
    onValueChange,
    onChange,
    onClear,
    displayEmpty,
    disabled = false,
    customSelectedColor,
    customSelectedFontSize,
    showOptionIcon = false,
    showOptionDescription = false,
    iconPosition = 'left',
    menuItemIconSX,
    optionsWithAvatar = false,
    showBorder,
    sx,
    labelSX = {},
    inputSX,
    inputProps,
    id,
    name,
    required,
    error = false,
    helperText = '',
    maxDisplayValueLength,
    className,
    customRenderValue,
    customRenderOption,
    showEmptyPlaceholder = true,
    emptyPlaceholder = <em>None</em>,
    onScroll,
    maxListHeight,
    customMenuProps = {},
    labelNode,
    variant = 'standard',
    separateLabel = false,
    multiple = false,
    withSearch = false,
    searchPlaceholder,
    onDeleteOption,
    searchFilterMode = 'local',
    searchString,
    onSearch,
    isListFetching = false,
  } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const effectiveMultiple = multiple && !!showBorder;

  const isSearchControlled = Boolean(withSearch && onSearch && searchString !== undefined);
  const effectiveSearchQuery = isSearchControlled ? searchString : internalSearchQuery;

  const realValue = useMemo(() => {
    if (effectiveMultiple) return Array.isArray(value) ? value : [];
    // Ensure single select always has a string value (never null or undefined)
    if (value === null || value === undefined) return '';
    return options && options.length ? value : '';
  }, [effectiveMultiple, options, value]);

  const filteredOptions = useMemo(() => {
    if (!withSearch || searchFilterMode === 'remote') return options;
    if (!effectiveSearchQuery) return options;
    return options.filter(opt => opt.label?.toLowerCase().includes(effectiveSearchQuery.toLowerCase()));
  }, [withSearch, searchFilterMode, effectiveSearchQuery, options]);

  const handleSearchInputChange = useCallback(
    next => {
      if (isSearchControlled) onSearch(next);
      else setInternalSearchQuery(next);
    },
    [isSearchControlled, onSearch],
  );

  const handleSearchClear = useCallback(() => {
    if (isSearchControlled) onSearch('');
    else setInternalSearchQuery('');
  }, [isSearchControlled, onSearch]);

  const theme = useTheme();

  const styles = useMemo(
    () =>
      singleSelectStyles(theme, {
        customSelectedColor,
        customSelectedFontSize,
        showBorder,
      }),
    [theme, customSelectedColor, customSelectedFontSize, showBorder],
  );

  const handleChange = useCallback(
    event => {
      if (!effectiveMultiple) setMenuOpen(false);
      const rawValue = event.target.value;
      const newValue = effectiveMultiple && typeof rawValue === 'string' ? rawValue.split(',') : rawValue;
      if (onValueChange) onValueChange(newValue);
      if (onChange) onChange(event);
    },
    [effectiveMultiple, onChange, onValueChange],
  );

  const handleDeleteChip = useCallback(
    (deletedValue, event) => {
      event.stopPropagation();
      const newValue = realValue.filter(v => v !== deletedValue);
      if (onValueChange) onValueChange(newValue);
      if (onChange) onChange({ target: { value: newValue } });
    },
    [realValue, onValueChange, onChange],
  );

  const handleMenuOpen = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
    if (withSearch) {
      if (isSearchControlled) onSearch?.('');
      else setInternalSearchQuery('');
    }
  }, [withSearch, isSearchControlled, onSearch]);

  const renderMultipleValue = useCallback(
    selected => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0 0 0.375rem' }}>
        {selected.map(selectedValue => {
          const foundOption = options.find(({ value: v }) => v === selectedValue);
          if (!foundOption) return null;
          return (
            <Chip
              key={selectedValue}
              label={
                <Typography
                  variant="labelSmall"
                  color="text.secondary"
                >
                  {foundOption.label}
                </Typography>
              }
              deleteIcon={<RemoveIcon />}
              onDelete={!disabled ? event => handleDeleteChip(selectedValue, event) : undefined}
              onMouseDown={event => event.stopPropagation()}
              sx={styles.chip}
            />
          );
        })}
      </Box>
    ),
    [options, handleDeleteChip, disabled, styles],
  );

  const renderValue = useCallback(
    selectedValue => {
      if (effectiveMultiple) {
        return customRenderValue ? customRenderValue(selectedValue) : renderMultipleValue(selectedValue);
      }

      const foundOption = options.find(({ value: itemValue }) => itemValue === selectedValue);
      if (!foundOption) return showEmptyPlaceholder ? emptyPlaceholder : '';

      const typography = (
        <Typography
          variant="labelMedium"
          color="inherit"
          component="div"
          maxWidth={maxDisplayValueLength}
          overflow={maxDisplayValueLength ? 'hidden' : undefined}
          whiteSpace={maxDisplayValueLength ? 'nowrap' : undefined}
          textOverflow={maxDisplayValueLength ? 'ellipsis' : undefined}
          sx={{ whiteSpaceCollapse: 'preserve' }}
        >
          {foundOption.label}
        </Typography>
      );

      const content = customRenderValue ? (
        customRenderValue(foundOption)
      ) : showOptionIcon ? (
        <ListItemText
          variant="labelMedium"
          primary={typography}
        />
      ) : (
        typography
      );

      return (
        <Box
          key={foundOption.value}
          value={foundOption.value}
          sx={styles.valueItem}
        >
          {content}
        </Box>
      );
    },
    [
      effectiveMultiple,
      renderMultipleValue,
      options,
      showEmptyPlaceholder,
      emptyPlaceholder,
      maxDisplayValueLength,
      customRenderValue,
      showOptionIcon,
      styles,
    ],
  );

  const renderMenuItems = useCallback(
    selectIconWithLabelSx => {
      const loadingFooter = isListFetching ? (
        <MenuItem
          key="__loading__"
          disabled
          value="__single_select_loading__"
          sx={{ justifyContent: 'center', pointerEvents: 'none', opacity: 1 }}
          onClick={e => e.preventDefault()}
        >
          <CircularProgress size={24} />
        </MenuItem>
      ) : null;

      const searchSlot = withSearch ? (
        <SingleSelectDropdown
          key="__search__"
          isSearchBar
          searchQuery={effectiveSearchQuery}
          onSearchChange={handleSearchInputChange}
          onSearchClear={handleSearchClear}
          searchPlaceholder={searchPlaceholder}
        />
      ) : null;

      if (filteredOptions.length < 1) {
        return [
          searchSlot,
          <MenuItem
            key="__empty__"
            sx={{ justifyContent: 'space-between' }}
            value=""
          >
            {emptyPlaceholder}
          </MenuItem>,
          loadingFooter,
        ].filter(Boolean);
      }

      const items = filteredOptions.map(option => (
        <SingleSelectDropdown
          key={option.value}
          value={option.value}
          option={option}
          isSelected={effectiveMultiple ? realValue.includes(option.value) : option.value === realValue}
          onClear={onClear}
          customRenderOption={customRenderOption}
          showOptionIcon={showOptionIcon}
          showOptionDescription={showOptionDescription}
          iconPosition={iconPosition}
          optionsWithAvatar={optionsWithAvatar}
          menuItemIconSX={{ ...menuItemIconSX, ...selectIconWithLabelSx }}
          onDeleteOption={onDeleteOption}
        />
      ));

      const withSearchSlot = searchSlot ? [searchSlot, ...items] : items;
      return loadingFooter ? [...withSearchSlot, loadingFooter] : withSearchSlot;
    },
    [
      withSearch,
      effectiveSearchQuery,
      handleSearchInputChange,
      handleSearchClear,
      searchPlaceholder,
      filteredOptions,
      effectiveMultiple,
      emptyPlaceholder,
      realValue,
      onClear,
      customRenderOption,
      showOptionIcon,
      showOptionDescription,
      iconPosition,
      optionsWithAvatar,
      menuItemIconSX,
      onDeleteOption,
      isListFetching,
    ],
  );

  const mergedMenuProps = useMemo(() => {
    const effectiveMaxListHeight = maxListHeight ?? DEFAULT_MAX_MENU_HEIGHT;

    const {
      MenuListProps: legacyMenuListProps = {},
      PaperProps: legacyPaperProps = {},
      slotProps: incomingSlotProps = {},
      sx: customMenuSx,
      ...restCustomMenu
    } = customMenuProps;

    const { sx: legacyPaperSx, ...legacyPaperRest } = legacyPaperProps;
    const incomingPaper = incomingSlotProps.paper || {};
    const { sx: incomingPaperSx, ...incomingPaperRest } = incomingPaper;

    const mergedPaperSlotProps = {
      ...legacyPaperRest,
      ...incomingPaperRest,
      sx: [
        {
          maxHeight: effectiveMaxListHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
        legacyPaperSx,
        incomingPaperSx,
      ].filter(Boolean),
    };

    const { sx: legacyListSx, ...legacyListRest } = legacyMenuListProps;
    const incomingList = incomingSlotProps.list || {};
    const { sx: incomingListSx, ...incomingListRest } = incomingList;

    const mergedListSlotProps = {
      ...(withSearch ? { autoFocusItem: false } : {}),
      ...legacyListRest,
      ...incomingListRest,
      sx: [
        { flex: 1, minHeight: 0, overflowY: 'auto' },
        ...(withSearch
          ? [
              {
                paddingTop: 0,
                border: 'none',
                boxShadow: 'none',
              },
            ]
          : []),
        legacyListSx,
        incomingListSx,
      ].filter(Boolean),
    };

    if (onScroll) {
      const prevOnScroll = mergedListSlotProps.onScroll;
      mergedListSlotProps.onScroll = event => {
        prevOnScroll?.(event);
        onScroll(event);
      };
    }

    return {
      ...restCustomMenu,
      sx: {
        '& .MuiPaper-root': {
          marginTop: '0.5rem',
        },
        ...customMenuSx,
      },
      slotProps: {
        ...incomingSlotProps,
        list: mergedListSlotProps,
        paper: mergedPaperSlotProps,
      },
    };
  }, [customMenuProps, maxListHeight, onScroll, withSearch]);

  const renderSelectComponent = (selectwithLabelSx, selectIconWithLabelSx) => {
    return (
      <FormControl
        fullWidth={showBorder !== false}
        required={required}
        sx={[styles.formControl, sx]}
        variant={variant}
        size="small"
        error={error}
        disabled={disabled}
      >
        {labelNode ??
          (label && !separateLabel && (
            <InputLabel
              sx={[
                {
                  left: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  ...(effectiveMultiple && {
                    '&:not(.MuiInputLabel-shrink)': { top: '0.5rem' },
                  }),
                },
                labelSX,
              ]}
            >
              {label}
            </InputLabel>
          ))}
        <Select
          className={className}
          labelId={id ? id + '-label' : 'simple-select-label-' + label}
          id={id || 'simple-select-' + label}
          name={name}
          multiple={effectiveMultiple || undefined}
          value={realValue}
          open={menuOpen}
          onOpen={handleMenuOpen}
          onClose={handleMenuClose}
          onChange={handleChange}
          IconComponent={ArrowDownIcon}
          displayEmpty={displayEmpty}
          renderValue={renderValue}
          label={label}
          sx={[styles.select, effectiveMultiple && styles.multipleSelect, inputSX, selectwithLabelSx]}
          inputProps={inputProps}
          MenuProps={mergedMenuProps}
        >
          {renderMenuItems(selectIconWithLabelSx)}
        </Select>
        {error && helperText && !multiple && !!showBorder && (
          <Banner.BannerMessage
            variant="error"
            message={helperText}
          />
        )}
      </FormControl>
    );
  };

  return separateLabel ? (
    <Box sx={styles.labelContainer}>
      <Typography
        variant="labelMedium"
        color="text.primary"
        sx={labelSX}
      >
        {label}
      </Typography>
      <Box>{renderSelectComponent(styles.selectwithLabel, styles.selectIconWithLabel)}</Box>
    </Box>
  ) : (
    renderSelectComponent()
  );
});

SingleSelect.displayName = 'SingleSelect';

const singleSelectStyles = (theme, { customSelectedColor, customSelectedFontSize, showBorder } = {}) => ({
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
  },
  valueItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectwithLabel: {
    margin: '0 !important',
    padding: '0.385rem !important',
    '& .MuiInput-input': {
      paddingBottom: '0.1875rem !important',
    },
    '& .MuiSelect-select': {
      paddingRight: showBorder ? 0 : '0.5rem !important',
    },
    '& .MuiSelect-icon': {
      top: 'calc(50% - 0.5625rem) !important',
    },
  },
  selectIconWithLabel: {
    width: '0.875rem !important',
    height: '1.125rem !important',
    fontSize: '0.875rem !important',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    svg: {
      fontSize: '0.875rem !important',
    },
  },
  select: {
    display: 'flex',
    height: '1.88rem',
    padding: '0.25rem 0rem',
    alignItems: 'center',
    gap: '0.625rem',
    '& .MuiOutlinedInput-notchedOutline': {
      borderWidth: 0,
    },
    '& .MuiOutlinedInput-input': {
      padding: '0.25rem 0 0.5rem',
    },
    '& .MuiSelect-icon': {
      top: 'calc(50% - 11px)',
    },
    '& .MuiSelect-select': {
      color: customSelectedColor,
      fontSize: customSelectedFontSize,
    },
    '& .MuiInput-input': {
      display: 'flex',
      alignItems: 'center',
    },
    '& fieldset': {
      border: 'none !important',
      outline: 'none !important',
    },
  },
  formControl: showBorder ? getSingleSelectShowBorderSx(theme) : getSingleSelectWithoutBorderSx(theme),
  multipleSelect: {
    height: 'auto',
    minHeight: '2.5rem',
    '& .MuiSelect-select': {
      height: 'auto !important',
      padding: '0.25rem 0',
    },
  },
  chip: {
    height: '1.5rem',
    margin: '0px !important',
    backgroundColor: theme.palette.background.tagChip.disabled,
    '& .MuiChip-label': {
      paddingLeft: '0.5rem',
      paddingRight: '0.75rem',
    },
    '& .MuiChip-deleteIcon': {
      color: theme.palette.icon.tagChip.default,
    },
    '&:not(.Mui-disabled) .MuiChip-deleteIcon:hover': {
      color: theme.palette.icon.tagChip.hover,
    },
  },
});

export default SingleSelect;
