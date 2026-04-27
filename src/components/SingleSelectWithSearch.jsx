import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import { typographyVariants } from '@/MainTheme';
import { StyledMenuItemIcon } from '@/[fsd]/shared/ui/select';
import CheckedIcon from '@/assets/checked-icon.svg?react';

import ArrowDownIcon from './Icons/ArrowDownIcon';
import SearchIcon from './Icons/SearchIcon';

const SCROLL_LOAD_MORE_THRESHOLD = 10;
const DEBOUNCE_DELAY_MS = 300;

const SingleSelectWithSearch = memo(
  ({
    searchString,
    onSearch,
    value,
    onValueChange,
    options,
    label,
    required,
    error,
    helperText,
    isFetching,
    maxListHeight = '33.125rem',
    paperZIndex = '1001',
    onLoadMore = () => {},
    noOptionsPlaceholder = 'No options',
    sx,
    onClose,
    renderValue,
    allowEmptySelection,
    hideSearch = false,
  }) => {
    // dropdown related
    const [anchorEl, setAnchorEl] = useState(null);
    const inputRef = useRef(null);
    const panelRef = useRef(null);
    const searchInputRef = useRef(null);
    const open = useMemo(() => Boolean(anchorEl), [anchorEl]);
    const selectedOption = useMemo(() => options.find(option => option.value === value), [options, value]);
    const panelWidth = panelRef.current?.clientWidth;
    const styles = SingleSelectWithSearchStyles({
      error,
      open,
      maxListHeight,
      paperZIndex,
      hasSelectedOption: Boolean(selectedOption?.label),
      panelWidth,
    });
    const popperId = useMemo(() => (open ? 'search-bar-popper' : undefined), [open]);

    const handleClickAway = useCallback(() => {
      setAnchorEl(null);
      inputRef.current?.blur();
      onClose?.();
    }, [onClose]);

    const openPanel = useCallback(() => {
      setAnchorEl(panelRef.current);
      searchInputRef.current?.focus();
    }, []);

    const handleFocus = useCallback(() => {
      if (!panelRef) return;
      if (!anchorEl) {
        openPanel();
      } else {
        handleClickAway();
      }
    }, [anchorEl, handleClickAway, openPanel]);

    // auto suggest list items interactions
    const handleInputChange = useCallback(
      event => {
        const newInputValue = event.target.value;
        onSearch(newInputValue);
      },
      [onSearch],
    );

    // search logics

    const onKeyDown = useCallback(
      event => {
        if (event.key === 'Enter') {
          onSearch(searchString);
        }
      },
      [onSearch, searchString],
    );

    const lockUnlockBodyScroll = type => {
      return (document.body.style.overflow = type === 'lock' ? 'hidden' : '');
    };

    useEffect(() => {
      lockUnlockBodyScroll(open ? 'lock' : 'unlock');

      return () => {
        lockUnlockBodyScroll('unlock');
      };
    }, [open]);

    const handleOptionSelect = useCallback(
      option => {
        if (allowEmptySelection) {
          onValueChange(selectedOption?.value === option.value ? null : option);
        } else {
          onValueChange(option);
        }
        handleClickAway();
      },
      [allowEmptySelection, handleClickAway, onValueChange, selectedOption?.value],
    );

    const onSelectItem = useCallback(option => () => handleOptionSelect(option), [handleOptionSelect]);

    const loadMoreOnScrollOver = debounce(e => {
      const containerDom = e.target || {};
      const clientHeight = containerDom.clientHeight;
      const scrollHeight = containerDom.scrollHeight;
      const scrollTop = containerDom.scrollTop;

      const isReachBottom = scrollTop + clientHeight > scrollHeight - SCROLL_LOAD_MORE_THRESHOLD;
      if (isReachBottom && !isFetching) onLoadMore();
    }, DEBOUNCE_DELAY_MS);

    return (
      <>
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            sx={sx}
            ref={panelRef}
          >
            <Box
              onClick={handleFocus}
              sx={styles.inputContainer}
            >
              <FieldLabel
                label={label}
                required={required}
                error={error}
                isActive={Boolean(open)}
              />

              <Box sx={styles.selectedValueContainer}>
                {renderValue ? (
                  renderValue(selectedOption)
                ) : (
                  <Typography
                    variant="bodyMedium"
                    component="div"
                    sx={styles.selectedValueText}
                  >
                    {selectedOption?.label || 'Select'}
                  </Typography>
                )}
                <SvgIcon
                  viewBox="0 0 16 16"
                  sx={styles.arrowIcon}
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
              sx={styles.popper}
            >
              <Box
                sx={styles.popperContainer}
                onScroll={loadMoreOnScrollOver}
              >
                {!hideSearch && (
                  <FormControl sx={styles.searchInputContainer}>
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
                      autoFocus
                    />
                  </FormControl>
                )}

                {options.length < 1 ? (
                  <MenuItem
                    sx={styles.styledMenuItem}
                    value=""
                  >
                    <em>{noOptionsPlaceholder}</em>
                  </MenuItem>
                ) : (
                  options.map(option => {
                    return (
                      <MenuItem
                        key={option.id || option.value?.path || option.value}
                        value={option.value}
                        onClick={onSelectItem(option)}
                        selected={option.value === selectedOption?.value}
                        sx={option.value === 'create_new' ? styles.createNewMenuItem : styles.styledMenuItem}
                      >
                        {option.value === 'create_new' && <Box sx={styles.createNewIcon}>{option.icon}</Box>}
                        <Box sx={styles.optionContentBox}>
                          <Typography
                            variant="labelMedium"
                            sx={styles.optionText}
                          >
                            {option.label}
                          </Typography>
                          {option.description && (
                            <Typography
                              variant="bodySmall"
                              sx={styles.optionText}
                            >
                              {option.description}
                            </Typography>
                          )}
                        </Box>
                        {option.value === selectedOption?.value && (
                          <StyledMenuItemIcon>
                            <CheckedIcon />
                          </StyledMenuItemIcon>
                        )}
                      </MenuItem>
                    );
                  })
                )}

                {isFetching && (
                  <Box sx={styles.loadingContainer}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            </Popper>
          </Box>
        </ClickAwayListener>
      </>
    );
  },
);

/** @type {MuiSx} */
const SingleSelectWithSearchStyles = ({
  error,
  open,
  maxListHeight,
  paperZIndex,
  hasSelectedOption,
  panelWidth,
}) => ({
  inputContainer: ({ palette }) => ({
    cursor: 'pointer',
    padding: '0.5rem 0.75rem',
    width: '100%',
    borderBottom: error
      ? '0.0625rem solid red'
      : open
        ? `0.125rem solid ${palette.primary.main}`
        : `0.0625rem solid ${palette.border.lines}`,
  }),
  arrowIcon: {
    fontSize: '1rem',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
  },
  selectedValueContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedValueText: ({ palette }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
    color: hasSelectedOption ? palette.text.secondary : palette.text.disabled,
  }),
  popper: {
    zIndex: paperZIndex,
    width: panelWidth,
  },
  popperContainer: ({ palette }) => ({
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    maxHeight: maxListHeight,
    overflowY: 'scroll',
    background: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    paddingBottom: '0.5rem',
  }),
  loadingContainer: {
    padding: '0.5rem 1.5rem',
  },
  searchInputContainer: ({ palette }) => ({
    width: '100%',
    padding: '0.75rem 1.25rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  searchInput: {
    ...typographyVariants.bodyMedium,
  },
  styledMenuItem: ({ palette }) => ({
    justifyContent: 'space-between',
    padding: '0.5rem 1.5rem',
    borderBottom: '0.0625rem solid ' + palette.border.lines,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&.Mui-selected': {
      background: palette.background.participant.active,
    },
  }),
  createNewMenuItem: ({ palette }) => ({
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1.5rem',
    borderBottom: '0.0625rem solid ' + palette.border.lines,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&.Mui-selected': {
      background: palette.background.participant.active,
    },
  }),
  createNewIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionContentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowX: 'hidden',
  },
  optionText: ({ palette }) => ({
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpaceCollapse: 'preserve',
    color: palette.text.secondary,
  }),
});

export const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  justifyContent: 'space-between',
  padding: '8px 24px',
  borderBottom: '1px solid ' + theme.palette.border.lines,
  '&:last-child': {
    borderBottom: 'none',
  },
  '&.Mui-selected': {
    background: theme.palette.background.participant.active,
  },
}));

export const FieldLabel = ({ label, required, error, isActive }) => {
  const labelColor = useMemo(() => {
    if (error) return 'error';
    if (isActive) return 'primary';
  }, [error, isActive]);

  return (
    <Box
      position="relative"
      display="inline-block"
    >
      <Typography
        color={labelColor}
        variant="bodySmall"
      >
        {label}
      </Typography>
      {required && (
        <Typography
          variant="bodySmall"
          component="span"
          color={labelColor}
          sx={{
            position: 'absolute',
            top: 3,
            right: '-6px',
          }}
        >
          *
        </Typography>
      )}
    </Box>
  );
};

SingleSelectWithSearch.displayName = 'SingleSelectWithSearch';

export default SingleSelectWithSearch;
