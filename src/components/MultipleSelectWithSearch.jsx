import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Box,
  CircularProgress,
  ClickAwayListener,
  FormControl,
  FormHelperText,
  Input,
  MenuItem,
  Popper,
  SvgIcon,
  Typography,
  debounce,
  useTheme,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import { typographyVariants } from '@/MainTheme';
import { StyledMenuItemIcon } from '@/[fsd]/shared/ui/select';
import CheckedIcon from '@/assets/checked-icon.svg?react';

import ArrowDownIcon from './Icons/ArrowDownIcon';
import SearchIcon from './Icons/SearchIcon';
import { FieldLabel } from './SingleSelectWithSearch';

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

export default function MultipleSelectWithSearch({
  searchString,
  onSearch,
  values = [],
  onValueChange,
  options,
  label,
  required,
  error,
  helperText,
  isFetching,
  maxListHeight = '530px',
  minListHeight = '160px',
  onLoadMore = () => {},
  paperZIndex = '1101',
  sx,
  labelSX = {},
  inputContainerSX = {},
  inputSX = {},
  emptyPlaceHolder = 'Select',
  emptyListPlaceHolder = 'No options',
  disabled,
  showSelectAll = true,
  withSearch = true,
  CustomMenuItem,
  multiple = true,
}) {
  // dropdown related
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null);
  const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
  const popperId = useMemo(() => (open ? 'search-bar-popper' : undefined), [open]);
  const selectedOption = useMemo(
    () => options.filter(option => values.includes(option.value)),
    [options, values],
  );
  const hasSelectedValues = useMemo(() => !!values.length, [values.length]);

  const theme = useTheme();
  const styles = multipleSelectWithSearchStyles();

  const handleClickAway = useCallback(() => {
    setAnchorEl(null);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (panelRef && !disabled) {
      if (!anchorEl) {
        setAnchorEl(panelRef.current);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      } else {
        handleClickAway();
      }
    }
  }, [anchorEl, disabled, handleClickAway]);

  // auto suggest list items interactions
  const handleInputChange = useCallback(
    event => {
      const newInputValue = event.target.value;
      onSearch(newInputValue);
    },
    [onSearch],
  );

  const onSelectAll = useCallback(() => {
    onValueChange(!hasSelectedValues ? options.map(option => option.value) : []);
  }, [hasSelectedValues, onValueChange, options]);

  // search logics

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter') {
        onSearch(searchString);
      }
    },
    [onSearch, searchString],
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const onSelectItem = useCallback(
    option => () => {
      if (multiple) {
        if (values.includes(option.value)) {
          onValueChange(values.filter(value => value !== option.value));
        } else {
          onValueChange([...values, option.value]);
        }
      } else {
        onValueChange([option.value]);
      }
      if (!multiple) {
        handleClickAway();
      }
    },
    [multiple, handleClickAway, values, onValueChange],
  );

  const loadMoreOnScrollOver = debounce(e => {
    const containerDom = e.target || {};
    const clientHeight = containerDom.clientHeight;
    const scrollHeight = containerDom.scrollHeight;
    const scrollTop = containerDom.scrollTop;

    const isReachBottom = scrollTop + clientHeight > scrollHeight - 10;
    if (isReachBottom && !isFetching) {
      onLoadMore();
    }
  }, 300);

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box
          sx={sx}
          ref={panelRef}
        >
          <Box
            onClick={handleFocus}
            sx={{
              cursor: !disabled ? 'pointer' : 'default',
              padding: '0px 12px',
              width: '100%',
              position: 'relative',
              borderBottom: error
                ? '1px solid red'
                : open
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.border.lines}`,
              ...inputContainerSX,
            }}
          >
            <Box sx={{ position: 'absolute', top: '-6px', left: '0px', ...labelSX }}>
              <FieldLabel
                label={label}
                required={required}
                error={error}
                isActive={Boolean(open)}
              />
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{ paddingTop: '22px', width: '100%', ...inputSX }}
            >
              <Typography
                variant="bodyMedium"
                component="div"
                sx={{
                  width: '100%',
                  textWrap: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpaceCollapse: 'preserve',
                }}
                color={
                  selectedOption.length && !disabled
                    ? theme.palette.text.secondary
                    : theme.palette.text.default
                }
              >
                {selectedOption.map(item => item.label).join(',') || emptyPlaceHolder}
              </Typography>
              <SvgIcon
                viewBox="0 0 16 16"
                sx={{
                  fontSize: '1rem',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <ArrowDownIcon />
              </SvgIcon>
            </Box>
          </Box>
          {error && helperText && (
            <FormControl error={error}>
              <FormHelperText>{error ? helperText : undefined}</FormHelperText>
            </FormControl>
          )}

          <Popper
            id={popperId}
            open={open}
            anchorEl={anchorEl}
            placement="bottom-start"
            style={{ width: panelRef.current?.clientWidth, zIndex: paperZIndex }}
          >
            <Box
              sx={{
                borderRadius: '8px',
                marginTop: '8px',
                maxHeight: maxListHeight,
                minHeight: minListHeight,
                overflowY: 'scroll',
                background: theme.palette.background.secondary,
                border: `1px solid ${theme.palette.border.lines}`,
                paddingBottom: '8px',
              }}
              onScroll={loadMoreOnScrollOver}
            >
              {withSearch && (
                <FormControl
                  sx={[
                    styles.searchInputContainer(theme),
                    { position: 'sticky', top: 0, zIndex: 1, background: 'inherit' },
                  ]}
                >
                  <Input
                    ref={searchInputRef}
                    sx={styles.searchInput}
                    disableUnderline
                    variant="standard"
                    placeholder="Search for ..."
                    value={searchString}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    startAdornment={
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    }
                  />
                </FormControl>
              )}
              {options.length < 1 ? (
                <MenuItem
                  sx={{ justifyContent: 'space-between' }}
                  value=""
                >
                  <em>{emptyListPlaceHolder}</em>
                </MenuItem>
              ) : (
                options.map(option => {
                  return CustomMenuItem ? (
                    <CustomMenuItem
                      key={option.value}
                      option={option}
                      selected={values.includes(option.value)}
                      onClick={onSelectItem(option)}
                      values={values}
                    />
                  ) : (
                    <MenuItem
                      selected={values.includes(option.value)}
                      key={option.value}
                      value={option.value}
                      sx={{
                        justifyContent: 'space-between',
                        background: values.includes(option.value)
                          ? theme.palette.background.participant.active
                          : undefined,
                      }}
                      onClick={onSelectItem(option)}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          overflowX: 'hidden',
                        }}
                      >
                        <Typography
                          variant="labelMedium"
                          color="text.secondary"
                          sx={{
                            overflowX: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpaceCollapse: 'preserve',
                          }}
                        >
                          {option.label}
                        </Typography>
                        <Typography
                          variant="bodySmall"
                          sx={{ overflowX: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {option.description}
                        </Typography>
                      </Box>
                      {values.includes(option.value) && (
                        <StyledMenuItemIcon>
                          <CheckedIcon />
                        </StyledMenuItemIcon>
                      )}
                    </MenuItem>
                  );
                })
              )}
              {isFetching ? (
                <Box sx={{ padding: '8px 24px' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : showSelectAll ? (
                <SelectAllButton
                  disableRipple
                  onClick={onSelectAll}
                  onChange={event => {
                    event.stopPropagation();
                  }}
                  onKeyDown={event => {
                    event.stopPropagation();
                  }}
                >
                  <Typography variant="labelMedium">
                    {hasSelectedValues ? 'Clear selected' : 'Select all'}
                  </Typography>
                </SelectAllButton>
              ) : null}
            </Box>
          </Popper>
        </Box>
      </ClickAwayListener>
    </>
  );
}

const multipleSelectWithSearchStyles = () => ({
  searchInputContainer: ({ palette }) => ({
    width: '100%',
    padding: '0.75rem 1.25rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  searchInput: {
    ...typographyVariants.bodyMedium,
  },
});
