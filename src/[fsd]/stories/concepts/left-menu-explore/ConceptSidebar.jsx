// Concept: the left menu as in Claude — project, "New chat", Artifacts, Explore, the chat history in the
// menu itself, one bottom row with Support Bot, Settings and help. Built from the team's sidebar parts (SidebarBody.jsx)
// and the team's chat list (ChatHistory, as shipped by EL-7563). Agents … Applications and the catalog moved into
// Explore's hover list; Credentials is the last row of that list (owner 2026-11-16: «credentials должно быть внутри
// Explorer»), its page as on dev.
import { memo } from 'react';

import { SELECT_STORY } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';

import { Box, Divider, GlobalStyles, IconButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { ChatHistory } from '@/[fsd]/features/chat/conversation-list/ui';
import { BrandLogo, Button } from '@/[fsd]/shared/ui';
import { Buttons, SidebarMenuItem, SidebarProjectSelect } from '@/[fsd]/widgets/sidebar-root/ui';
import ArtifactsIcon from '@/assets/artifacts-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { NAV_BAR_HEIGHT_IN_PX } from '@/common/constants';

import ExploreMenu from './ExploreMenu';

export const CONCEPT_SIDEBAR_WIDTH = 288;
// The team's collapsed menu (COLLAPSED_SIDE_BAR_WIDTH in src/common/constants.js).
export const CONCEPT_RAIL_WIDTH = 64;

const noop = () => {};

// A section from Explore's hover list opens its own page: another story, switched the way the links addon does. The
// concept is also shown as the bare iframe.html (no Storybook around it): there nobody hears the channel, so the page
// opens the story's iframe.html itself (owner 2026-11-12: «тут не работает переход»).
const EXPLORE_SECTION_STORY = 'concepts-left-menu-explore--section-page-story';
const openStory = storyId => {
  if (window.parent !== window) {
    addons.getChannel().emit(SELECT_STORY, { storyId });
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set('id', storyId);
  url.searchParams.set('viewMode', 'story');
  window.location.assign(url.toString());
};
const openExploreSection = () => openStory(EXPLORE_SECTION_STORY);

const ConceptSidebar = memo(({ active = 'chat', onToggleAssistant }) => {
  const styles = sidebarStyles();
  const goNowhere = () => noop;
  return (
    <Box
      component="nav"
      sx={styles.container}
      data-testid="concept-sidebar"
    >
      <Box sx={styles.header}>
        <IconButton
          size="large" // component-check: allow as in the team's SidebarBody.jsx
          color="inherit"
          sx={styles.homeButton}
        >
          <BrandLogo sx={styles.eliteaIcon} />
        </IconButton>
        <Buttons.NotificationButton />
      </Box>
      <Divider sx={styles.divider} />
      <SidebarProjectSelect />
      <Divider sx={styles.divider} />
      <Box sx={styles.createSection}>
        <Button.BaseBtn
          variant="special"
          startIcon={<PlusIcon />}
          fullWidth
        >
          New chat
        </Button.BaseBtn>
      </Box>
      <Box sx={styles.section}>
        <SidebarMenuItem
          display
          menuTitle="Artifacts"
          menuIcon={<ArtifactsIcon />}
          selected={active === 'artifacts'}
          onClick={noop}
          to="#"
          showLabel
        />
        <ExploreMenu
          active={active}
          onOpenSection={openExploreSection}
        />
      </Box>
      <Divider sx={styles.sectionDivider} />
      <Box sx={styles.history}>
        <ChatHistory onOpenConversation={noop} />
      </Box>
      {/* One bottom row as in Katya's menu: Settings | help | Support Bot. The team's assistant package draws its
          button only in a corner of the window, so the concept moves that corner onto the right cell of the row. */}
      <GlobalStyles styles={assistantOnMenuRight} />
      <Box sx={styles.footerBlock}>
        <Box sx={styles.footerSettings}>
          <Buttons.SettingsButton navigateToPage={goNowhere} />
        </Box>
        <Box sx={styles.footerHelp}>
          <Buttons.ResourcesButton />
        </Box>
        <Box
          sx={styles.assistantBlock}
          onClick={onToggleAssistant}
          aria-label="Support Bot"
        />
      </Box>
    </Box>
  );
});
ConceptSidebar.displayName = 'ConceptSidebar';

// The menu folded to icons, as the team's sidebar does when collapsed (SidebarBody.jsx with sideBarCollapsed): the story
// sets settings.sideBarCollapsed, so the team's parts (project, Settings, help) draw their own collapsed look.
// A section page opens with the menu folded (owner 2026-11-12: «узковато»): 224 px more for the lists.
export const ConceptRail = memo(({ active = 'section', onToggleAssistant }) => {
  const styles = sidebarStyles();
  const goNowhere = () => noop;
  const item = (title, icon, key, selected = active === key, onClick = noop) => (
    <SidebarMenuItem
      key={key}
      display
      menuTitle={title}
      tooltip={title}
      menuIcon={icon}
      selected={selected}
      onClick={onClick}
      to="#"
      showLabel={false}
    />
  );
  return (
    <Box
      component="nav"
      sx={[styles.container, styles.rail]}
      data-testid="concept-rail"
    >
      <Box sx={styles.railHeader}>
        <IconButton
          size="large" // component-check: allow as in the team's SidebarBody.jsx
          color="inherit"
          sx={[styles.homeButton, styles.railHomeButton]}
        >
          <BrandLogo sx={styles.eliteaIcon} />
        </IconButton>
      </Box>
      <Divider sx={styles.divider} />
      <SidebarProjectSelect />
      <Divider sx={styles.divider} />
      {/* The folded menu on dev (SidebarBody.jsx collapsed): the «+» in its own block, a full-width line under it, then
          the 32 px tabs 8 px apart (owner 2026-11-12: the folded menu as on dev). */}
      <Box sx={styles.railCreate}>
        {/* The team's collapsed «+» (CreateEntityButton.jsx: special, icon only, 1.75rem), the expanded New chat's look. */}
        <Tooltip
          title="New chat"
          placement="right"
        >
          <Button.BaseBtn
            variant="special"
            startIcon={<PlusIcon />}
            aria-label="New chat"
            sx={styles.railNewChat}
          />
        </Tooltip>
      </Box>
      <Divider sx={styles.divider} />
      <Box sx={styles.railSection}>
        {item('Artifacts', <ArtifactsIcon />, 'artifacts')}
        <ExploreMenu
          active={active}
          showLabel={false}
          onOpenSection={openExploreSection}
        />
      </Box>
      <Box sx={styles.grow} />
      <Box sx={styles.railFooter}>
        <Buttons.SettingsButton navigateToPage={goNowhere} />
        <Divider sx={styles.railFooterDivider} />
        <Buttons.ResourcesButton />
      </Box>
      {/* The bot's own cell, as the folded menu on dev (SidebarBody footerBlock: 3.25rem under a line); the assistant
          package's corner button sits in it at its own place, as on dev. */}
      <Box
        sx={styles.railBot}
        onClick={onToggleAssistant}
        aria-label="Support Bot"
      />
    </Box>
  );
});
ConceptRail.displayName = 'ConceptRail';

// The bottom row is Katya's Settings | help | bot (owner 2026-11-11), 52 px high as dev's footerBlock (SidebarBody.jsx:
// 3.25rem with its line at the top; owner 2026-11-16 «1а»), so the bot sits 11 px under the line and 12 px above the
// window's edge, as on dev. The help cell is the team's own 3.25rem (ResourcesButton.jsx); the bot gets a cell of the
// same size at the right end of the row. The package puts its 1.75rem button 0.75rem above the window's bottom edge
// (position bottom-left); only its left edge moves, so the button sits in the middle of that cell and its chat window
// still opens to the right of it, over the page.
const FOOTER_CELL_REM = 3.25;
const assistantOnMenuRight = {
  '.elitea-assistant-container--bottom-left': {
    left: `calc(${CONCEPT_SIDEBAR_WIDTH}px - ${FOOTER_CELL_REM}rem + ${(FOOTER_CELL_REM - 1.75) / 2}rem) !important`, // component-check: allow the package can only sit in a window corner; Katya's 72:4208 puts the bot at the right end of the menu's bottom row
  },
};

/** @type {MuiSx} */
const sidebarStyles = () => ({
  container: ({ palette }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: `${CONCEPT_SIDEBAR_WIDTH}px`,
    minWidth: `${CONCEPT_SIDEBAR_WIDTH}px`,
    // The team's menu line on the right (Sidebar.jsx), outside the 288 px as in Katya's 289 px frame
    boxSizing: 'content-box',
    borderRight: `0.0625rem solid ${palette.components.sidebar.divider}`,
    background: palette.components.sidebar.background,
    overflow: 'hidden',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    minHeight: `${NAV_BAR_HEIGHT_IN_PX} !important`, // component-check: allow header height of the team's sidebar (NAV_BAR_HEIGHT_IN_PX)
    padding: '0 1rem',
    justifyContent: 'space-between',
  },
  homeButton: {
    padding: 0,
    marginLeft: '-0.5rem',
    width: '2.75rem',
    height: '2.75rem',
    background: 'transparent',
  },
  eliteaIcon: { fontSize: '1.75rem' },
  rail: { width: `${CONCEPT_RAIL_WIDTH}px`, minWidth: `${CONCEPT_RAIL_WIDTH}px` },
  railHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: `${NAV_BAR_HEIGHT_IN_PX} !important`, // component-check: allow header height of the team's sidebar (NAV_BAR_HEIGHT_IN_PX)
  },
  // SidebarBody.jsx collapsed: the logo centred (no -0.5rem), the create block 12/16 px, the tabs section 8 px gaps.
  railHomeButton: { marginLeft: 0 },
  railCreate: { padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  railSection: {
    padding: '0.5rem 1rem',
    gap: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  // The team's collapsed create button (CreateEntityButton.jsx): 1.75rem.
  railNewChat: { width: '1.75rem !important', minWidth: '1.75rem !important' }, // component-check: allow the team's collapsed Create button size (CreateEntityButton.jsx simpleButton)
  // The folded menu on dev (owner 2026-11-12: dev beats the Figma frame here): SidebarBody's bottom section — Settings,
  // a full-width line, the next 32 px tab, 8 px apart — with help in the place of the catalog, which moved to Customize.
  railFooter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
  },
  railFooterDivider: ({ palette }) => ({
    borderColor: palette.border.subtle,
    alignSelf: 'stretch',
    marginInline: '-1rem',
  }),
  railBot: ({ palette }) => ({
    height: '3.25rem', // SidebarBody footerBlock
    boxSizing: 'border-box', // the line at the cell's top, as the team's ::before
    flexShrink: 0,
    borderTop: `0.0625rem solid ${palette.border.subtle}`,
    ':hover': { background: palette.components.sidebar.menuItem.hover, cursor: 'pointer' },
  }),
  grow: { flex: 1 },
  divider: ({ palette }) => ({ borderColor: palette.border.subtle }),
  // Katya's 72:4208: the line under Artifacts and Customize runs the full width of the menu, as the lines above it
  sectionDivider: ({ palette }) => ({ borderColor: palette.border.subtle }),
  createSection: { padding: '0.75rem 1rem 0.25rem', display: 'flex', flexDirection: 'column' },
  // Katya's 72:4208: the 32 px menu rows step by 36 px, 4 px apart, and the line under them 12 px below the last one
  section: { padding: '0.5rem 1rem 0.75rem', gap: '0.25rem', display: 'flex', flexDirection: 'column' },
  // The chat list fills the rest of the menu, framed as the team's SidebarChatsArea
  history: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingInline: '1rem',
    paddingTop: '0.75rem',
  },
  footerBlock: ({ palette }) => ({
    display: 'flex',
    alignItems: 'stretch',
    height: `${FOOTER_CELL_REM}rem`,
    boxSizing: 'border-box', // the line at the row's top inside its 52 px, as the team's ::before
    flexShrink: 0,
    borderTop: `0.0625rem solid ${palette.border.subtle}`,
  }),
  // The cell the assistant package's floating button sits on (assistantOnMenuRight).
  assistantBlock: ({ palette }) => ({
    width: `${FOOTER_CELL_REM}rem`,
    flexShrink: 0,
    borderLeft: `0.0625rem solid ${palette.border.subtle}`,
    ':hover': { background: palette.components.sidebar.menuItem.hover, cursor: 'pointer' },
  }),
  // Every cell of the bottom row lights up whole on hover, as the bot's cell does (owner 2026-11-11): the team's
  // Settings and help buttons are stretched over their cells and lose their rounded 32 px hover pill.
  footerSettings: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    borderRight: `0.0625rem solid ${palette.border.subtle}`,
    '& > [data-tour]': {
      height: '100%',
      borderRadius: 0,
      paddingInline: '1.5rem 1rem', // Katya: the Settings icon 24 px from the menu's edge
    },
  }),
  footerHelp: {
    display: 'flex',
    flexShrink: 0,
    width: `${FOOTER_CELL_REM}rem`,
    '& > [data-tour] > div': { width: '100%', height: '100%', borderRadius: 0 },
  },
});

export default ConceptSidebar;
