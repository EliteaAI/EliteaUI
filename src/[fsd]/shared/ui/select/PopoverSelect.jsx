import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, MenuItem, Popover, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SimpleSearchBar from '@/[fsd]/shared/ui/input/SimpleSearchBar';

const PopoverSelect = memo(props => {
  const {
    options = [],
    onValueChange,
    label = 'Select',
    placeholder = 'Search...',
    emptyPlaceholder = 'No options found',
    buttonVariant = BUTTON_VARIANTS.elitea,
    buttonColor = 'secondary',
    popoverWidth = '16rem',
    maxHeight = '20rem',
    startIcon,
    endIcon,
    buttonSx,
  } = props;

  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef(null);

  const open = Boolean(anchorEl);

  const handleOpen = useCallback(() => {
    setAnchorEl(buttonRef.current);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSearchQuery('');
  }, []);

  const handleSelect = useCallback(
    value => {
      onValueChange(value);
      handleClose();
    },
    [onValueChange, handleClose],
  );

  const handleSearchChange = useCallback(value => {
    setSearchQuery(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(opt => opt.label?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchQuery]);

  const styles = getStyles({ popoverWidth, maxHeight });

  return (
    <>
      <Button.BaseBtn
        ref={buttonRef}
        variant={buttonVariant}
        color={buttonColor}
        endIcon={endIcon}
        startIcon={startIcon}
        onClick={handleOpen}
        sx={buttonSx}
      >
        {label}
      </Button.BaseBtn>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: styles.popoverPaper } }}
      >
        <SimpleSearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchClear={handleSearchClear}
          placeholder={placeholder}
          sx={styles.searchBar}
          onKeyDown={e => e.stopPropagation()}
        />
        <Box sx={styles.optionsList}>
          {filteredOptions.length === 0 && (
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.emptyMessage}
            >
              {emptyPlaceholder}
            </Typography>
          )}
          {filteredOptions.map(option => (
            <MenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              sx={styles.menuItem}
            >
              <Typography
                variant="labelMedium"
                color="text.secondary"
                sx={styles.menuItemLabel}
              >
                {option.label}
              </Typography>
            </MenuItem>
          ))}
        </Box>
      </Popover>
    </>
  );
});

PopoverSelect.displayName = 'PopoverSelect';

export default PopoverSelect;

/** @type {MuiSx} */
const getStyles = ({ popoverWidth, maxHeight }) => ({
  popoverPaper: ({ palette }) => ({
    marginTop: '-1.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.secondary,
    boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.24)',
    width: popoverWidth,
    maxHeight,
    display: 'flex',
    flexDirection: 'column',
  }),
  searchBar: ({ palette }) => ({
    borderRadius: 0,
    border: 'none',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: 'transparent',
    padding: '0.75rem 1rem',
    height: 'auto',
    '&:focus-within': {
      backgroundColor: 'transparent',
      borderColor: palette.border.lines,
    },
  }),
  optionsList: {
    overflowY: 'auto',
    flex: 1,
  },
  menuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    '&:hover': {
      backgroundColor: palette.background.select?.hover || palette.action.hover,
    },
  }),
  menuItemLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyMessage: {
    padding: '1rem',
    textAlign: 'center',
  },
});
