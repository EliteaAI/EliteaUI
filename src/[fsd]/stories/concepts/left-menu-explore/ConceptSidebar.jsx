// Concept: the left menu as in Claude — project, "New chat", Artifacts, Explore, the chat history in the
// menu itself, one bottom row with Support Bot, Settings and help. Built from the team's sidebar parts (SidebarBody.jsx)
// and the team's chat list (Conversations). Agents … Applications and the catalog moved into Explore's hover list;
// Credentials is the last row of that list (owner 2026-11-16: «credentials должно быть внутри Explorer»), its page as on dev.
// History as in Katya's menu (Figma Prototypes 72:4208, owner 2026-11-10): "Chats" with icons only, groups Pinned and
// Recent that collapse, a row is just the chat's name.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SELECT_STORY } from 'storybook/internal/core-events';
import { addons } from 'storybook/preview-api';

import { Box, Divider, GlobalStyles, IconButton, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { Conversations } from '@/[fsd]/features/chat/conversation-list/ui';
import { BrandLogo, Button } from '@/[fsd]/shared/ui';
import { SimpleSearchBar } from '@/[fsd]/shared/ui/input';
import { Buttons, SidebarMenuItem, SidebarProjectSelect } from '@/[fsd]/widgets/sidebar-root/ui';
import ArtifactsIcon from '@/assets/artifacts-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { DefaultFolderName, NAV_BAR_HEIGHT_IN_PX } from '@/common/constants';
import CloseIcon from '@/components/Icons/CloseIcon';
import NewFolder from '@/components/Icons/NewFolder';
import SearchIcon from '@/components/Icons/SearchIcon';

import ExploreMenu from './ExploreMenu';
import { CHAT_FOLDERS, DATE_GROUPS, USER } from './data';

export const CONCEPT_SIDEBAR_WIDTH = 288;
// The team's collapsed menu (COLLAPSED_SIDE_BAR_WIDTH in src/common/constants.js).
export const CONCEPT_RAIL_WIDTH = 64;
// The team's ArrowDownIcon (src/components/Icons) turned to point right, as a mask for the group arrow.
const ARROW_RIGHT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path transform="rotate(-90 8 8)" fill-rule="evenodd" clip-rule="evenodd" d="M2.64645 5.64645C2.84171 5.45118 3.15829 5.45118 3.35355 5.64645L8 10.2929L12.6464 5.64645C12.8417 5.45118 13.1583 5.45118 13.3536 5.64645C13.5488 5.84171 13.5488 6.15829 13.3536 6.35355L8.70711 11C8.31658 11.3905 7.68342 11.3905 7.29289 11L2.64645 6.35355C2.45118 6.15829 2.45118 5.84171 2.64645 5.64645Z"/></svg>';

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

// Chat folders inside the groups (owner 2026-11-12: «как на Dev, в наших группах»): a pinned folder at the top of
// Pinned, the other folders at the top of Recent; a folded group hides its folders too. The team's list draws pinned
// folders, pinned chats, other folders and then the date groups one after another (Conversations.jsx), so the concept
// unwraps the groups (display: contents) and puts the parts in that order on the list's own flex column.
// For the team's code: Conversations takes a slot for folders inside a group instead of this.
const LIST = '& div:has(> [data-tour="chat-folders"])';
const PINNED_FOLDERS = `${LIST} > div:first-of-type:not([data-tour])`;
const OTHER_FOLDERS = `${LIST} > [data-tour="chat-folders"]`;
const GROUPS = `${LIST} > div:has([data-testid^="chat-conversation-group-header-"])`;
const groupBox = name => `[data-testid="chat-conversation-group-header-${name}"]`;
const foldersInGroups = {
  [`${GROUPS}, ${GROUPS} > div, ${GROUPS} > div > div, ${GROUPS} [data-testid^="chat-conversation-group-header-"]`]:
    {
      display: 'contents',
    },
  [`${LIST} > *`]: { order: 10 },
  // The list is a scrolling column of fixed height: unwrapped, the groups' parts would shrink to fit it and overlap.
  [`${LIST} > *, ${LIST} [data-testid^="chat-conversation-group-header-"] > *`]: { flexShrink: 0 },
  [`${LIST} ${groupBox('Pinned')} > div:first-of-type`]: { order: 1 },
  [PINNED_FOLDERS]: { order: 2, paddingLeft: '1rem' }, // the group's 16 px indent (DateGroup's Collapse)
  [`${LIST} ${groupBox('Pinned')} > .MuiCollapse-root`]: { order: 3 },
  [`${LIST} ${groupBox('Recent')} > div:first-of-type`]: { order: 4 },
  [OTHER_FOLDERS]: { order: 5, paddingLeft: '1rem' },
  [`${LIST} ${groupBox('Recent')} > .MuiCollapse-root`]: { order: 6 },
  // DateGroup's own 8 px under a group, lost with its box.
  [`${LIST} [data-testid^="chat-conversation-group-header-"] > .MuiCollapse-root`]: {
    marginBottom: '0.5rem',
  },
  [`${LIST}:has(${groupBox('Pinned')} > .MuiCollapse-hidden) > div:first-of-type:not([data-tour])`]: {
    display: 'none',
  },
  [`${LIST}:has(${groupBox('Recent')} > .MuiCollapse-hidden) > [data-tour="chat-folders"]`]: {
    display: 'none',
  },
};

// The header of the chat list as in Katya's 72:4208: "Chats", then search and new folder as the team's 28 px icon
// buttons without a fill (IconButton elitea tertiary), 4 px apart; import is the third (owner 2026-11-10). The team's
// own header mixes a filled search button with a 50 px wide import button, so its icons stood unevenly apart.
const ChatHistoryHeader = ({ searching, query, onSearch, onQuery, onCreateFolder }) => {
  const theme = useTheme();
  const styles = sidebarStyles();
  return (
    <>
      <Box sx={styles.historyHeader}>
        <Typography variant="subtitle">Chats</Typography>
        <Box sx={styles.historyActions}>
          <Tooltip
            title="Search chats"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              aria-label="Search chats"
              onClick={() => onSearch(true)}
            >
              <SearchIcon
                sx={styles.icon16}
                fill={theme.palette.icon.secondary}
              />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="Create folder"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              aria-label="Create folder"
              onClick={onCreateFolder}
            >
              <NewFolder
                sx={styles.icon16}
                fill={theme.palette.icon.secondary}
              />
            </IconButton>
          </Tooltip>
          <Tooltip
            title="Import"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              aria-label="Import"
            >
              <ImportIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {searching && (
        <Box sx={styles.searchBarContainer}>
          <SimpleSearchBar
            searchQuery={query}
            onSearchChange={event => onQuery(event?.target?.value ?? event)}
            onSearchClear={() => onQuery('')}
            placeholder="Search chats..."
          />
          <IconButton
            onClick={() => {
              onQuery('');
              onSearch(false);
            }}
            variant="elitea"
            color="tertiary"
            aria-label="Close search"
          >
            <CloseIcon sx={styles.closeIcon} />
          </IconButton>
        </Box>
      )}
    </>
  );
};

// Chat folders as on dev, kept in the story's state only (nothing reaches a backend). Each handler makes the change
// the team's hook makes to the list after its request succeeds: NewChat.jsx (onClickCreateNewFolder),
// useCreateFolder, useEditFolder (onEditFolder, onPinFolder), useDeleteFolder, useMoveToFolderConversation.
const useConceptFolders = setDateGroups => {
  const [folders, setFolders] = useState(CHAT_FOLDERS);
  const nextId = useRef(400);
  const created = folder => ({
    id: nextId.current++,
    name: folder.name,
    owner_id: USER.id,
    meta: { is_pinned: false },
    conversations: [],
    total: 0,
  });
  return useMemo(() => {
    // A chat leaves wherever it is (a group or a folder) and goes into the folder, or back to Recent with no folder.
    const moveChat = (chat, target) => {
      const moved = { ...chat, folder_id: target?.id ?? null };
      const without = list => list.filter(c => c.id !== chat.id);
      setFolders(prev =>
        prev.map(f => {
          const conversations = without(f.conversations);
          if (f.id === target?.id) conversations.unshift(moved);
          return { ...f, conversations, total: conversations.length };
        }),
      );
      setDateGroups(prev =>
        prev.map(g => {
          const conversations = without(g.conversations);
          if (!target && g.name === 'Recent') conversations.unshift(moved);
          return { ...g, conversations, total: conversations.length };
        }),
      );
      return moved;
    };
    const dropNew = () => setFolders(prev => prev.filter(f => !f.isNew));
    return {
      folders,
      setFolders,
      onClickCreateNewFolder: () =>
        setFolders(prev =>
          prev.some(f => f.isNew)
            ? prev
            : [
                { id: `new-${nextId.current}`, name: DefaultFolderName, conversations: [], isNew: true },
                ...prev,
              ],
        ),
      onCreateFolder: folder => setFolders(prev => [created(folder), ...prev.filter(f => !f.isNew)]),
      onCancelCreateFolder: dropNew,
      // Only the name: the folder handed back may carry the search-filtered chats.
      onEditFolder: folder =>
        setFolders(prev => prev.map(f => (f.id === folder.id ? { ...f, name: folder.name } : f))),
      onPinFolder: (folder, is_pinned) =>
        setFolders(prev =>
          prev.map(f => (f.id === folder.id ? { ...f, meta: { ...f.meta, is_pinned } } : f)),
        ),
      onDeleteFolder: folder => setFolders(prev => prev.filter(f => f.id !== folder.id)),
      onMoveToFolderConversation: async (chat, target) => moveChat(chat, target),
      onMoveToNewFolderConversation: async chat =>
        setFolders(prev =>
          prev.some(f => f.isNew)
            ? prev
            : [
                {
                  id: `${chat.id}_to_new_folder`,
                  name: DefaultFolderName,
                  conversations: [],
                  isNew: true,
                  targetConversationId: chat.id,
                  targetConversation: chat,
                },
                ...prev,
              ],
        ),
      moveTargetConversationToNewFolder: async folder => {
        const made = created(folder);
        setFolders(prev => [made, ...prev.filter(f => !f.isNew)]);
        return moveChat(folder.targetConversation, made);
      },
    };
  }, [folders, setDateGroups]);
};

// Matching folders and their matching chats while the menu's search is open (the team's list filters them by its own
// search field, which the menu replaces).
const filterFolders = (folders, q) =>
  folders
    .map(f => {
      const conversations = f.conversations.filter(c => c.name.toLowerCase().includes(q));
      return { ...f, conversations, total: conversations.length };
    })
    .filter(f => f.isNew || f.conversations.length || f.name.toLowerCase().includes(q));

// The pin on a pinned chat and on a pinned folder unpins it on click, with a hover look and the «Unpin» tooltip (owner
// 2026-11-12: the folder's pin did nothing). The team's rows draw both pins as bare icons (ConversationItem
// chat-pin-icon; FolderAccordion: the PinIcon after the name) and unpin only from the row's «⋮» menu, so the concept
// listens for the click on the menu itself. For the team's code: the pin as a button with that tooltip in both rows.
const CHAT_PIN = '[data-testid="chat-pin-icon"]';
const FOLDER_PIN =
  '[data-testid^="chat-folder-item-"] .MuiAccordionSummary-content > div > svg:last-child:not(:first-child)';
const PIN_ICONS = `${CHAT_PIN}, ${FOLDER_PIN}`;
const pinTarget = event => event.target.closest?.(PIN_ICONS);

// A chat leaves Pinned for Recent at its place by date, or goes to the top of Pinned (the team's list after its
// pin request: useConversationPin).
const pinChat = (groups, chat, isPinned) => {
  const moved = { ...chat, isPinned };
  return groups.map(g => {
    const conversations = g.conversations.filter(c => c.id !== chat.id);
    if (isPinned && g.name === 'Pinned') conversations.unshift(moved);
    if (!isPinned && g.name === 'Recent') {
      conversations.push(moved);
      conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    return { ...g, conversations, total: conversations.length };
  });
};

const ChatHistory = memo(({ selectedId }) => {
  const [allGroups, setDateGroups] = useState(DATE_GROUPS);
  const { folders: allFolders, ...folderActions } = useConceptFolders(setDateGroups);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const dateGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups
      .map(group => {
        const found = group.conversations.filter(c => c.name.toLowerCase().includes(q));
        return { ...group, conversations: found, total: found.length };
      })
      .filter(group => group.conversations.length);
  }, [allGroups, query]);
  const folders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? filterFolders(allFolders, q) : allFolders;
  }, [allFolders, query]);
  const conversations = dateGroups.flatMap(group => group.conversations);
  // Katya's menu opens both groups. The team's list opens only the group of the selected chat or "Today"
  // (useDateGroupExpansion), so the concept opens the closed ones once with the team's own header click.
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const group of DATE_GROUPS) {
        const header = document.querySelector(
          `[data-testid="concept-sidebar"] [data-testid="chat-conversation-group-header-${group.name}"] > div`,
        );
        const open = header?.nextElementSibling?.classList.contains('MuiCollapse-entered');
        if (header && !open) header.click();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const onPinConversation = useCallback(
    (chat, isPinned) => setDateGroups(prev => pinChat(prev, chat, isPinned)),
    [],
  );
  const latest = useRef();
  latest.current = { allGroups, allFolders, onPinFolder: folderActions.onPinFolder, onPinConversation };
  const [pinTip, setPinTip] = useState(null);
  useEffect(() => {
    const nav = document.querySelector('[data-testid="concept-sidebar"]');
    if (!nav) return undefined;
    const onClick = event => {
      const icon = pinTarget(event);
      if (!icon) return;
      event.stopPropagation(); // not the row: no chat opens, no folder folds
      event.preventDefault();
      setPinTip(null);
      const { allGroups: groups, allFolders: list, onPinFolder, onPinConversation: onPin } = latest.current;
      const folderRow = icon.matches(FOLDER_PIN) && icon.closest('[data-testid^="chat-folder-item-"]');
      if (folderRow) {
        const id = folderRow.dataset.testid.replace('chat-folder-item-', '');
        const folder = list.find(f => String(f.id) === id);
        if (folder) onPinFolder(folder, false);
        return;
      }
      const id = icon
        .closest('[data-testid^="chat-conversation-item-"]')
        ?.dataset.testid.replace('chat-conversation-item-', '');
      const chat = groups.flatMap(g => g.conversations).find(c => String(c.id) === id);
      if (chat) onPin(chat, false);
    };
    const onOver = event => setPinTip(pinTarget(event) ?? null);
    nav.addEventListener('click', onClick, true);
    const onLeave = () => setPinTip(null);
    nav.addEventListener('mouseover', onOver);
    nav.addEventListener('mouseleave', onLeave);
    return () => {
      nav.removeEventListener('click', onClick, true);
      nav.removeEventListener('mouseover', onOver);
      nav.removeEventListener('mouseleave', onLeave);
    };
  }, []);
  return (
    <>
      <Tooltip
        title="Unpin"
        placement="top"
        open={Boolean(pinTip)}
        slotProps={{ popper: { anchorEl: pinTip } }}
      >
        <Box
          component="span"
          sx={hiddenAnchor}
        />
      </Tooltip>
      <ChatHistoryHeader
        searching={searching}
        query={query}
        onSearch={setSearching}
        onQuery={setQuery}
        onCreateFolder={folderActions.onClickCreateNewFolder}
      />
      <Conversations
        conversations={conversations}
        pinnedConversations={[]}
        dateGroups={dateGroups}
        setDateGroups={setDateGroups}
        ungroupedConversationsCount={conversations.length}
        totalConversationsAmount={conversations.length}
        selectedConversationId={selectedId}
        collapsed={false}
        onCollapsed={noop}
        folders={folders}
        setFolders={folderActions.setFolders}
        onSelectConversation={noop}
        onEditConversation={noop}
        onDeleteConversation={noop}
        onDuplicateConversation={noop}
        onPlaybackConversation={noop}
        onLoadMore={noop}
        onPinConversation={onPinConversation}
        onCreateConversation={noop}
        onCancelCreateConversation={noop}
        onChangeActiveConversationName={noop}
        onCreateFolder={folderActions.onCreateFolder}
        onCancelCreateFolder={folderActions.onCancelCreateFolder}
        onDeleteFolder={folderActions.onDeleteFolder}
        onChangeActiveFolderName={noop}
        onEditFolder={folderActions.onEditFolder}
        onPinFolder={folderActions.onPinFolder}
        onMoveToFolderConversation={folderActions.onMoveToFolderConversation}
        onMoveToNewFolderConversation={folderActions.onMoveToNewFolderConversation}
        moveTargetConversationToNewFolder={folderActions.moveTargetConversationToNewFolder}
        cancelMovingTargetConversationToNewFolder={noop}
        onClickCreateNewFolder={folderActions.onClickCreateNewFolder}
        onCreateConversationInFolder={noop}
        onCloseCanvas={noop}
        toastSuccess={noop}
        toastError={noop}
        onSearchQueryChange={noop}
        onReorderFolders={noop}
        onRestrictAccessSuccess={noop}
        onImportedConversation={noop}
        enableDragAndDrop={false}
      />
    </>
  );
});
ChatHistory.displayName = 'ChatHistory';

const ConceptSidebar = memo(({ active = 'chat', selectedConversationId, onToggleAssistant }) => {
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
        <ChatHistory selectedId={selectedConversationId} />
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

const hiddenAnchor = { display: 'none' };

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
  // The team's chat list fills the rest of the menu; its own frame (padding, background) is reset to the menu's.
  history: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingInline: '1rem', // Katya's 72:4208: chat rows 16 px from both edges of the menu (16…272 of 288)
    paddingTop: '0.75rem', // Katya's 72:4208: "Chats" sits ~21 px below the line above it (owner 2026-11-11)
    '& > [data-tour="chat-conversations"]': {
      flex: 1,
      minHeight: 0,
      background: 'transparent !important',
      paddingTop: 0,
    }, // component-check: allow the team's chat list sits inside the menu, so its own ground goes
    // The menu draws the list's header itself (ChatHistoryHeader); the team's own header row goes.
    '& > [data-tour="chat-conversations"] > div:first-of-type': { display: 'none' },
    // Katya's decision 2026-11-11 (Alita Library Accordion): the group arrow is the library's 16 px «arrow down» in
    // grey, not MUI's 14 px white chevron. The team's ArrowDownIcon path, turned to point right: DateGroup rotates it
    // 90° when the group is open.
    '& [data-testid^="chat-conversation-group-header-"] > div:first-of-type .MuiIconButton-root': {
      padding: '.125rem .25rem', // the library arrow 24 px from the menu's edge, the title 28 px right of it (Katya's 72:4208)
      '& > svg': { display: 'none' },
      '&::before': {
        content: '""',
        width: '1rem',
        height: '1rem',
        backgroundColor: ({ palette }) => palette.icon.default,
        mask: `url("data:image/svg+xml,${encodeURIComponent(ARROW_RIGHT_SVG)}") center / contain no-repeat`,
      },
    }, // component-check: allow Katya's decision 2026-11-11: the library's 16 px arrow on the team's DateGroup
    '& [data-testid^="chat-conversation-group-header-"] > div:first-of-type .MuiTypography-root': {
      lineHeight: '1rem',
    }, // component-check: allow Katya's decision 2026-11-11: group title 12/16 as Alita Library
    // Katya's decision 2026-11-11 (Alita Library Conversation): a chat row is 36 px with 4 px 12 px padding, no line.
    '& [data-testid^="chat-conversation-item-"]': {
      height: '2.25rem',
      padding: '.25rem .75rem',
      borderBottom: 'none',
    }, // component-check: allow Katya's decision 2026-11-11: chat row as Alita Library Conversation
    ...foldersInGroups,
    // The pins unpin on click (ChatHistory): a pointer and the lighter icon on hover, as the team's PinButton.
    [`& ${CHAT_PIN}, & ${FOLDER_PIN}`]: {
      cursor: 'pointer',
      '&:hover path': { fill: ({ palette }) => palette.icon.secondary },
    },
    // A folder row looks like a chat row (owner 2026-11-12: «строки папок оформить в одном стиле по решению Кати»):
    // 36 px, 4 px 12 px padding, no ground, no line, the library's 16 px grey arrow as on the groups. The team's
    // FolderAccordion draws a filled rounded card 41 px high with a line under it and a 14 px white chevron.
    // !important: the team's StyledAccordion and FolderAccordion sx outrank a parent's sx.
    '& [data-testid^="chat-folder-item-"]': {
      background: 'transparent !important',
      boxShadow: 'none',
      borderRadius: '0 !important',
      '& > .MuiAccordion-heading > div:first-of-type': {
        height: '2.25rem',
        padding: '.25rem .75rem !important',
        gap: '.5rem', // the chat row's 8 px before «⋮», so a hovered pin stands where a chat's does
        borderBottom: 'none',
        boxSizing: 'border-box',
      },
      // A tree that reads top-down: arrow where chat names start, folder icon and name 4 px and 8 px after it, the
      // folder's chats under the folder's name (the team's 12 px gaps and 16 px detail indent put them 40 px left of it).
      '& .MuiAccordionSummary-content': { marginLeft: '.25rem !important' },
      '& .MuiAccordionSummary-content > div': { gap: '.5rem', flex: 1, minWidth: 0 },
      // The pin at the row's right edge, where a pinned chat has it (owner 2026-11-12: «да» to moving it); the team's
      // FolderAccordion puts it right after the name.
      '& .MuiAccordionSummary-content > div > svg:last-child:not(:first-child)': {
        marginLeft: 'auto',
        flexShrink: 0,
      },
      '& .MuiAccordionDetails-root': { paddingLeft: '2.75rem !important' },
      '& .MuiAccordionSummary-root': {
        paddingInline: '0 !important',
        minHeight: '0 !important',
        height: '100%',
      },
      '& [data-testid="chat-folder-expand-icon"]': { display: 'none' },
      '& .MuiAccordionSummary-expandIconWrapper::before': {
        content: '""',
        display: 'block',
        width: '1rem',
        height: '1rem',
        backgroundColor: ({ palette }) => palette.icon.default,
        mask: `url("data:image/svg+xml,${encodeURIComponent(ARROW_RIGHT_SVG)}") center / contain no-repeat`,
      },
    }, // component-check: allow Katya's decision 2026-11-11 (chat row, library arrow) carried to the team's folder row
    // The name field of a new folder: the team's editor is 100% wide plus its padding, so it ran 32 px past the menu.
    // Its height stays the team's (the field's underline needs it); no ground and the row's 12 px, as a chat row.
    '& div:has(> [data-testid="chat-folder-name-confirm-button"])': {
      boxSizing: 'border-box',
      background: 'transparent !important',
      paddingInline: '.75rem !important',
    },
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '2rem',
    // Katya's 72:4208: the first group's arrow 18 px under "Chats"; the 28 px icon buttons need the 32 px row, so the
    // row gives 8 px back below it
    marginBottom: '-0.5rem',
    // Katya: "Chats" 24 px from the menu's edge, the last icon 16 px from the other (the list sits 16 px in).
    paddingLeft: '0.5rem',
    paddingRight: 0,
  },
  historyActions: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  icon16: { width: '1rem', height: '1rem' },
  searchBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0 0.25rem',
  },
  closeIcon: { fontSize: '1.25rem' },
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
