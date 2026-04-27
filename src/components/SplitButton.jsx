import React, { useMemo } from 'react';

import {
  Box,
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';

import { StyledMenuItemIcon } from '@/[fsd]/shared/ui/select';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import { useTheme } from '@emotion/react';

import ArrowDownIcon from './Icons/ArrowDownIcon';

export default function SplitButton({ defaultValue = '', options = [], onClick }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedOption, setSelectedOption] = React.useState(
    options.find(option => option.value === defaultValue),
  );
  const menuListStyle = useMemo(
    () => ({
      '& .MuiMenuItem-root': {
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '500',
        lineHeight: '24px',
        padding: '8px 20px 8px 20px',

        '&:hover': {
          backgroundColor: theme.palette.background.select.hover,
        },

        '&.Mui-selected': {
          backgroundColor: theme.palette.background.select.selected.default,
        },

        '&.Mui-selected:hover': {
          backgroundColor: theme.palette.background.select.selected.hover,
        },
      },
    }),
    [
      theme.palette.background.select.hover,
      theme.palette.background.select.selected.default,
      theme.palette.background.select.selected.hover,
    ],
  );

  const handleToggle = React.useCallback(() => {
    setOpen(prevOpen => !prevOpen);
  }, []);

  const handleClose = React.useCallback(event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  }, []);

  const onClickOption = React.useCallback(
    option => event => {
      handleClose(event);
      setSelectedOption(option);
      onClick(option.value);
    },
    [handleClose, onClick],
  );

  return (
    <>
      <ClickAwayListener onClickAway={handleClose}>
        <Box>
          <ButtonGroup
            sx={{
              '.MuiButtonGroup-grouped': {
                borderRightColor: `${theme.palette.border.category.selected} !important`,
              },
              '.MuiButtonGroup-grouped.MuiButtonGroup-firstButton': {
                borderRightColor: `${theme.palette.border.category.selected} !important`,
              },
              borderRadius: '14px',
              height: '28px',
            }}
            variant="contained"
            ref={anchorRef}
            aria-label="split button"
          >
            <Button
              variant="alita"
              disableRipple
              sx={{ marginRight: '0px' }}
              color="secondary"
              onClick={onClickOption(selectedOption)}
            >
              {selectedOption.label}
            </Button>
            <Button
              variant="alita"
              disableRipple
              sx={{ marginRight: '0px' }}
              color="secondary"
              aria-controls={open ? 'split-button-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-label="select merge strategy"
              aria-haspopup="menu"
              onClick={handleToggle}
            >
              <ArrowDownIcon />
            </Button>
          </ButtonGroup>
          <Popper
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
            sx={{
              zIndex: theme.zIndex.modal + 100, // Higher than modal z-index
            }}
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper
                  sx={{
                    color: 'secondary',
                    background: theme.palette.background.secondary,
                    zIndex: theme.zIndex.modal + 100,
                  }}
                >
                  <MenuList
                    sx={menuListStyle}
                    id="split-button-menu"
                  >
                    {options.map(({ label, value }) => (
                      <MenuItem
                        selected={selectedOption.value === value}
                        key={value}
                        sx={{
                          justifyContent: 'space-between',
                          background:
                            selectedOption.value === value
                              ? theme.palette.background.participant.active
                              : undefined,
                        }}
                        onClick={onClickOption({ label, value })}
                      >
                        <Typography
                          color="text.secondary"
                          variant="bodyMedium"
                        >
                          {label}
                        </Typography>
                        {selectedOption.value === value && (
                          <StyledMenuItemIcon>
                            <CheckedIcon />
                          </StyledMenuItemIcon>
                        )}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Paper>
              </Grow>
            )}
          </Popper>
        </Box>
      </ClickAwayListener>
    </>
  );
}
