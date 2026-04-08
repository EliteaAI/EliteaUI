import { memo } from 'react';

import { MenuItem, MenuList, Paper, Popper } from '@mui/material';

const FStringAutocompletePopper = memo(props => {
  const { open, anchorEl, options, highlightedIndex, onSelect, popperSx } = props;

  const styles = fStringAutocompletePopperStyles();

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      sx={[styles.popper, ...(Array.isArray(popperSx) ? popperSx : popperSx ? [popperSx] : [])]}
    >
      <Paper
        elevation={0}
        sx={styles.paper}
      >
        <MenuList
          dense
          disablePadding
        >
          {options.map((option, index) => (
            <MenuItem
              key={option.value}
              selected={index === highlightedIndex}
              onMouseDown={event => event.preventDefault()}
              onClick={() => onSelect(option.value)}
              sx={styles.option}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </Paper>
    </Popper>
  );
});

FStringAutocompletePopper.displayName = 'FStringAutocompletePopper';

/** @type {MuiSx} */
const fStringAutocompletePopperStyles = () => ({
  popper: ({ zIndex }) => ({
    zIndex: zIndex.modal + 1,
  }),
  paper: ({ palette }) => ({
    marginTop: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    background: palette.background.secondary,
    maxHeight: '14rem',
    minWidth: '12rem',
    overflowY: 'auto',
  }),
  option: ({ palette }) => ({
    padding: '0.5rem 1rem',
    minHeight: '2.5rem',
    fontSize: '0.875rem',
    color: palette.text.primary,
    '&:hover': {
      backgroundColor: palette.background.select.hover,
    },
    '&.Mui-selected': {
      backgroundColor: palette.background.select.hover,
    },
    '&.Mui-selected:hover': {
      backgroundColor: palette.background.select.hover,
    },
  }),
});

export default FStringAutocompletePopper;
