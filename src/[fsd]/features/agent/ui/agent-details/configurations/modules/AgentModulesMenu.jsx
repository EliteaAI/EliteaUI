import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, ClickAwayListener, Grow, MenuList, Paper, Popper, Typography, useTheme } from '@mui/material';

import { DropdownConstants, TourTargetConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';
import PlusIcon from '@/assets/plus-icon.svg?react';
import SearchIcon from '@/components/Icons/SearchIcon';

import AgentModuleMenuItem from './AgentModuleMenuItem';

const POPPER_MODIFIERS = [
  { name: 'offset', options: { offset: [0, 8] } },
  { name: 'preventOverflow', options: { boundary: 'viewport', altBoundary: true, tether: true } },
];

const AgentModulesMenu = memo(props => {
  const { modules = [], readOnly = false } = props;

  const theme = useTheme();
  const styles = agentModulesMenuStyles();

  const listRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');

  const open = Boolean(anchorEl);

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return modules;
    return modules.filter(module => module.title?.toLowerCase().includes(query));
  }, [modules, search]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setSearch('');
  }, []);

  const handleToggleMenu = useCallback(
    event => {
      if (anchorEl) return handleClose();
      setAnchorEl(event.currentTarget);
    },
    [anchorEl, handleClose],
  );

  const handleClickAway = useCallback(
    event => {
      if (anchorEl?.contains(event.target)) return;
      handleClose();
    },
    [anchorEl, handleClose],
  );

  const handleSearchChange = useCallback(event => setSearch(event.target.value), []);

  const handleSearchKeyDown = useCallback(event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    listRef.current?.querySelector('[role="menuitemcheckbox"]')?.focus();
  }, []);

  const handleKeyDown = useCallback(
    event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      handleClose();
      anchorEl?.focus();
    },
    [anchorEl, handleClose],
  );

  return (
    <>
      <Button.BaseBtn
        data-testid="agent-add-modules-button"
        data-tour={TourTargetConstants.AGENT_TOUR_TARGET_IDS.advancedSettings}
        variant={BUTTON_VARIANTS.iconLabel}
        startIcon={<PlusIcon />}
        disableRipple
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggleMenu}
      >
        Modules
      </Button.BaseBtn>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        strategy="fixed"
        modifiers={POPPER_MODIFIERS}
        transition
        sx={styles.popper}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: 'left top' }}
          >
            <Paper
              sx={styles.paper}
              onKeyDown={handleKeyDown}
              data-testid="agent-modules-menu"
            >
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box>
                  <Box sx={styles.searchContainer}>
                    <SearchIcon
                      style={styles.searchIcon}
                      fill={theme.palette.icon.secondary}
                    />
                    <Input.InputBase
                      variant={INPUT_VARIANTS.standard}
                      placeholder="Search modules..."
                      value={search}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      enableAutoBlur={false}
                      disableUnderline
                      autoFocus
                      inputProps={{
                        'data-testid': 'agent-modules-search-input',
                        'aria-label': 'Search modules',
                      }}
                      sx={styles.searchField}
                    />
                  </Box>
                  {filteredModules.length > 0 ? (
                    <MenuList
                      ref={listRef}
                      disabledItemsFocusable
                      aria-label="Modules"
                      sx={styles.list}
                    >
                      {filteredModules.map(module => (
                        <AgentModuleMenuItem
                          key={module.name}
                          module={module}
                          readOnly={readOnly}
                        />
                      ))}
                    </MenuList>
                  ) : (
                    <Typography
                      variant="bodyMedium"
                      component="div"
                      sx={styles.emptyMessage}
                    >
                      {search ? 'No modules found' : 'No modules available'}
                    </Typography>
                  )}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
});

AgentModulesMenu.displayName = 'AgentModulesMenu';

/** @type {MuiSx} */
const agentModulesMenuStyles = () => ({
  popper: ({ zIndex }) => ({
    zIndex: zIndex.modal + 10,
  }),
  paper: ({ palette }) => ({
    marginTop: DropdownConstants.SPACING.MENU_TOP_MARGIN,
    width: '20rem',
    borderRadius: DropdownConstants.BORDER_RADIUS.MENU,
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    boxShadow: palette.boxShadow.default,
    overflow: 'hidden',
  }),
  searchContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    height: DropdownConstants.DIMENSIONS.ITEM_HEIGHT,
    padding: '0.25rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  searchIcon: {
    width: '1.25rem',
    height: '1.25rem',
    flexShrink: 0,
  },
  searchField: ({ palette }) => ({
    '& .MuiInputBase-input': {
      padding: 0,
      color: palette.text.primary,
      '&::placeholder': {
        color: palette.text.disabled,
        opacity: 1,
      },
    },
  }),
  list: {
    maxHeight: '20.3125rem',
    overflowY: 'auto',
    padding: '0.25rem 0',
  },
  emptyMessage: ({ palette }) => ({
    padding: '0.5rem 1rem',
    color: palette.text.secondary,
  }),
});

export default AgentModulesMenu;
