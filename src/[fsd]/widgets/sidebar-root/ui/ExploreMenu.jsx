import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, ClickAwayListener, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { AppLink } from '@/[fsd]/shared/ui';
import { useExploreSections, useSidebarNavigation } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import SidebarMenuItem from '@/[fsd]/widgets/sidebar-root/ui/SidebarMenuItem';
import AppsIcon from '@/assets/applications-icon.svg?react';
import CompassIcon from '@/assets/compass.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import SkillsIcon from '@/assets/skill-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';

const SECTION_ICONS = {
  agents: ApplicationsIcon,
  pipelines: FlowIcon,
  skills: SkillsIcon,
  toolkits: ToolIcon,
  mcps: MCPIcon,
  applications: AppsIcon,
  credentials: KeyIcon,
};

// The item ends 1rem before the menu's edge in both states, so the list stands 0.5rem right of the menu
const POPPER_MODIFIERS = [{ name: 'offset', options: { offset: [0, 24] } }];
// Time for the pointer to cross the gap between the item and the list
const CLOSE_DELAY_MS = 200;
// The list opens to the right of Explore, so these keys step into it / back out of it
const OPEN_LIST_KEYS = ['ArrowDown', 'ArrowRight'];
const CLOSE_LIST_KEY = 'ArrowLeft';

const ExploreMenu = memo(props => {
  const { showLabel = true } = props;
  const anchorRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [focusList, setFocusList] = useState(false);
  const { sections, selectedSection } = useExploreSections();
  const { navigateToPage, getLinkTarget } = useSidebarNavigation();

  const styles = exploreMenuStyles();

  const keepOpen = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);

  const closeSoon = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setFocusList(false);
    }, CLOSE_DELAY_MS);
  }, []);

  const close = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    setOpen(false);
    setFocusList(false);
  }, []);

  const closeAndRefocus = useCallback(() => {
    close();
    triggerRef.current?.focus();
  }, [close]);

  const onTriggerClick = useCallback(
    event => {
      keepOpen();
      // Keyboard activation (Enter/Space) has no click count: move focus into the portalled list
      if (event.detail === 0) setFocusList(true);
    },
    [keepOpen],
  );

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Escape' && open) {
        closeAndRefocus();
        return;
      }
      if (OPEN_LIST_KEYS.includes(event.key) && event.target === triggerRef.current) {
        event.preventDefault();
        keepOpen();
        setFocusList(true);
      }
    },
    [closeAndRefocus, keepOpen, open],
  );

  const onListKeyDown = useCallback(
    event => {
      // The list lives at the end of the page, so Tab would leave the sidebar: return to Explore instead
      if (event.key !== 'Tab' && event.key !== CLOSE_LIST_KEY) return;
      event.preventDefault();
      closeAndRefocus();
    },
    [closeAndRefocus],
  );

  const onSelectSection = useCallback(
    section => event => {
      close();
      navigateToPage(section.url, section.breadCrumb ?? section.label, { collapseSidebar: true })(event);
    },
    [close, navigateToPage],
  );

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  if (!sections.length) return null;

  return (
    <ClickAwayListener onClickAway={close}>
      <Box
        ref={anchorRef}
        onMouseEnter={keepOpen}
        onMouseLeave={closeSoon}
        onKeyDown={onKeyDown}
        data-testid="sidebar-explore"
      >
        <SidebarMenuItem
          display
          menuTitle="Explore"
          menuIcon={<CompassIcon />}
          selected={!!selectedSection || open}
          // A click after the hover must not close the list again
          onClick={onTriggerClick}
          showLabel={showLabel}
          tourId={SIDEBAR_TOUR_TARGET_IDS.explore}
          buttonProps={{ ref: triggerRef, 'aria-haspopup': 'menu', 'aria-expanded': open }}
        />
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="right-start"
          modifiers={POPPER_MODIFIERS}
          sx={styles.popper}
        >
          <Paper
            elevation={8}
            sx={styles.paper}
            onMouseEnter={keepOpen}
            onMouseLeave={closeSoon}
            data-testid="sidebar-explore-menu"
          >
            <MenuList
              aria-label="Explore"
              autoFocusItem={focusList}
              onKeyDown={onListKeyDown}
              sx={styles.list}
            >
              {sections.map(section => {
                const Icon = SECTION_ICONS[section.value];
                return (
                  <MenuItem
                    key={section.value}
                    component={AppLink}
                    to={getLinkTarget(section.url)}
                    selected={section.value === selectedSection}
                    onClick={onSelectSection(section)}
                    sx={styles.item}
                    data-testid={`sidebar-explore-${section.value}`}
                  >
                    <Box
                      component={Icon}
                      sx={styles.icon}
                    />
                    <Typography variant="labelSmall">{section.label}</Typography>
                  </MenuItem>
                );
              })}
            </MenuList>
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
});

ExploreMenu.displayName = 'ExploreMenu';

/** @type {MuiSx} */
const exploreMenuStyles = () => ({
  popper: {
    zIndex: 1300,
  },
  paper: ({ palette }) => ({
    minWidth: '12.5rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    // The shorthand: the theme's Paper sets a `background` gradient that `backgroundColor` would not replace
    background: palette.background.default.secondary,
    overflow: 'hidden',
  }),
  list: {
    padding: '0.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  item: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    height: '2rem',
    minHeight: '2rem',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    color: palette.text.metrics,
    // Icons follow the row's text colour, as the menu items do
    '& path': {
      fill: 'currentColor',
    },
    '&:hover, &.Mui-selected:hover': {
      backgroundColor: palette.components.sidebar.menuItem.hover,
    },
    '&.Mui-selected': {
      backgroundColor: palette.components.sidebar.menuItem.selected,
      color: palette.text.secondary,
    },
  }),
  icon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
});

export default ExploreMenu;
