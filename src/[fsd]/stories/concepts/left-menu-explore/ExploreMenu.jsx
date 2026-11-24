// «Explore» in the left menu (owner 2026-11-13; the only version from 2026-11-16): as «Explore» in ChatGPT's sidebar,
// hovering the item opens a list of the sections — Agents, Pipelines, Skills, Toolkits & Indexes, MCPs, Applications —
// and a section opens its own page; Credentials, the last row, keeps its own page as on dev (owner 2026-11-16:
// «credentials должно быть внутри Explorer»), which the concept does not draw. Every section is one hover away. A click on the item opens the list too
// (keyboard, touch).
// The list goes on from the left menu, so its rows are the menu's rows (SidebarMenuItem: labelSmall 12/16 medium in the
// menu's grey, 32 px, 16 px icon 8 px before the words, the menu's hover and selected grounds), as ChatGPT's Explore
// list repeats its sidebar's rows (owner 2026-11-13: the chat «+» menu's 14 px rows «сильно контрастирует» with the menu).
// The ground is the team's chat «+» menu paper (PlusChatButton.jsx: 0.75rem radius with a line). It opens on hover,
// which the team's menus do not do (they open on click).
import { memo, useEffect, useRef, useState } from 'react';

import { Box, MenuItem, MenuList, Paper, Popper, Typography } from '@mui/material';

import { SidebarMenuItem } from '@/[fsd]/widgets/sidebar-root/ui';
import CompassIcon from '@/assets/compass.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';

import { SECTIONS } from './SectionPage';
import { setSectionTab, useSectionTab } from './sectionTab';

// Credentials is no section page (no Yours / Discover, no catalog): the row goes to the team's /credentials page as is.
const ROWS = [...SECTIONS, { key: 'credentials', label: 'Credentials', Icon: KeyIcon }];

// The list stands 8 px right of the menu's edge: the item ends 16 px before the edge in both the open menu
// (288 px, item 16…272) and the folded one (64 px, a 32 px item centred), so 24 px from the item.
const OFFSET = [0, 24];
const POPPER_MODIFIERS = [{ name: 'offset', options: { offset: OFFSET } }];
// The pointer crosses the 24 px gap from the item to the list: closing waits that long.
const CLOSE_DELAY_MS = 200;

const ExploreMenu = memo(({ active, showLabel = true, onOpenSection }) => {
  const anchorRef = useRef(null);
  const timer = useRef(null);
  const [open, setOpen] = useState(false);
  const { tab } = useSectionTab();
  const onSection = active === 'section';

  const keepOpen = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = key => () => {
    clearTimeout(timer.current);
    setOpen(false);
    if (key === 'credentials') return; // the team's /credentials page, not drawn in the concept
    setSectionTab(key);
    if (!onSection) onOpenSection();
  };

  return (
    <Box
      ref={anchorRef}
      onMouseEnter={keepOpen}
      onMouseLeave={closeSoon}
      data-testid="explore-item"
    >
      <SidebarMenuItem
        display
        menuTitle="Explore"
        // the list itself names the sections, so the folded menu shows no tooltip over it
        menuIcon={<Box component={CompassIcon} />}
        selected={onSection || open}
        onClick={() => setOpen(value => !value)}
        to="#"
        showLabel={showLabel}
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
          data-testid="explore-menu"
        >
          <MenuList
            sx={styles.list}
            autoFocusItem={false}
          >
            {ROWS.map(({ key, label, Icon }) => (
              <MenuItem
                key={key}
                selected={onSection && tab === key}
                onClick={pick(key)}
                sx={styles.item}
                data-testid={`explore-menu-${key}`}
              >
                <Box
                  component={Icon}
                  sx={styles.icon}
                />
                <Typography variant="labelSmall">{label}</Typography>
              </MenuItem>
            ))}
          </MenuList>
        </Paper>
      </Popper>
    </Box>
  );
});
ExploreMenu.displayName = 'ExploreMenu';

/** @type {MuiSx} */
const styles = {
  popper: { zIndex: 9998 }, // as the team's chat «+» menu
  paper: ({ palette }) => ({
    minWidth: '12.5rem', // 200 px: the 12 px rows need less than the chat «+» menu's 242
    borderRadius: '.75rem',
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.default.secondary,
    overflow: 'hidden',
  }),
  list: { padding: '.25rem', display: 'flex', flexDirection: 'column', gap: '.25rem' }, // 4 px apart, as the menu's items
  item: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    padding: '.5rem',
    height: '2rem',
    minHeight: '2rem',
    boxSizing: 'border-box',
    borderRadius: '.5rem',
    color: palette.text.metrics,
    '& path': { fill: palette.text.metrics },
    '&:hover, &.Mui-selected:hover': { background: palette.components.sidebar.menuItem.hover },
    '&.Mui-selected': {
      background: palette.components.sidebar.menuItem.selected,
      color: palette.text.secondary,
      '& path': { fill: palette.icon.secondary },
    },
  }),
  icon: { width: '1rem', height: '1rem', flexShrink: 0 },
};

export default ExploreMenu;
