import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Avatar,
  Box,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';

import { DropdownConstants } from '@/[fsd]/shared/lib/constants';
import { Input } from '@/[fsd]/shared/ui';
import AtIcon from '@/assets/at-icon.svg?react';
import UsersIcon from '@/components/Icons/UsersIcon';
import UserAvatar from '@/components/UserAvatar';

import { MENTION_EVERYONE, MENTION_EVERYONE_MIN_USERS, MENTION_SEARCH_MIN_USERS } from '../../lib/constants';

const EVERYONE_LABEL = 'Everyone';

const getUserName = participant => participant.meta?.user_name || '';

const UsersMentionDropdown = memo(props => {
  const { open, anchorEl, users = [], currentUserId, ownerId, onMention, onClose } = props;

  const [query, setQuery] = useState('');
  // As wide as the card it opens under
  const styles = usersMentionDropdownStyles(anchorEl?.offsetWidth);

  const isOwner = useCallback(item => ownerId != null && item.entity_meta?.id == ownerId, [ownerId]);
  // The owner comes first, then everyone else by name
  const others = useMemo(
    () =>
      users
        .filter(item => item.entity_meta?.id != currentUserId)
        .sort(
          (a, b) =>
            isOwner(b) - isOwner(a) ||
            getUserName(a).toLowerCase().localeCompare(getUserName(b).toLowerCase()),
        ),
    [currentUserId, isOwner, users],
  );
  // You are listed as one of the people with access, but cannot mention yourself
  const me = useMemo(() => users.find(item => item.entity_meta?.id == currentUserId), [currentUserId, users]);
  const search = query.trim().toLowerCase();
  const matches = useCallback(item => getUserName(item).toLowerCase().includes(search), [search]);
  const filtered = useMemo(() => others.filter(matches), [others, matches]);
  const showMe = !!others.length && !!me && matches(me);
  // With one person besides the owner, Everyone would mention just that person
  const peopleBesidesOwner = users.filter(item => !isOwner(item)).length;
  const showEveryone =
    peopleBesidesOwner >= MENTION_EVERYONE_MIN_USERS && EVERYONE_LABEL.toLowerCase().includes(search);
  const showSearch = others.length >= MENTION_SEARCH_MIN_USERS;

  const handleClose = useCallback(() => {
    setQuery('');
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  const handleMention = useCallback(
    participant => () => {
      setQuery('');
      onMention?.(participant);
    },
    [onMention],
  );

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-start"
      strategy="fixed"
      transition
      modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
      sx={styles.popper}
    >
      {({ TransitionProps }) => (
        <Grow {...TransitionProps}>
          <Paper
            sx={styles.paper}
            data-testid="chat-users-mention-dropdown"
          >
            <ClickAwayListener onClickAway={handleClose}>
              <Box>
                {showSearch && (
                  <Box sx={styles.search}>
                    <Input.SimpleSearchBar
                      searchQuery={query}
                      onSearchChange={setQuery}
                      onSearchClear={() => setQuery('')}
                      placeholder="Search user ..."
                      sx={styles.searchBar}
                      data-testid="chat-users-mention-search"
                    />
                  </Box>
                )}
                <MenuList
                  autoFocusItem={!showSearch}
                  sx={styles.list}
                >
                  {showEveryone && (
                    <MenuItem
                      sx={styles.item}
                      onClick={handleMention(MENTION_EVERYONE)}
                      data-testid="chat-users-mention-everyone"
                    >
                      <Avatar sx={styles.everyoneAvatar}>
                        <UsersIcon sx={styles.everyoneIcon} />
                      </Avatar>
                      <Typography
                        variant="bodyMedium"
                        sx={styles.name}
                      >
                        {EVERYONE_LABEL}
                      </Typography>
                      <Box
                        className="mention-icon"
                        sx={styles.at}
                      >
                        <AtIcon />
                      </Box>
                    </MenuItem>
                  )}
                  {showMe && (
                    <MenuItem
                      disabled
                      sx={styles.meItem}
                      data-testid="chat-users-mention-me"
                    >
                      <UserAvatar
                        name={getUserName(me)}
                        avatar={me.meta?.user_avatar}
                        size={20}
                      />
                      <Typography
                        variant="bodyMedium"
                        sx={styles.meName}
                      >
                        {getUserName(me)}
                      </Typography>
                      <Typography
                        variant="bodyMedium"
                        sx={styles.you}
                      >
                        (You)
                      </Typography>
                      {isOwner(me) && (
                        <Typography
                          variant="bodySmall"
                          sx={[styles.ownerBadge, styles.meOwnerBadge]}
                          data-testid="chat-users-mention-owner"
                        >
                          Owner
                        </Typography>
                      )}
                    </MenuItem>
                  )}
                  {filtered.map(participant => (
                    <MenuItem
                      key={participant.id}
                      sx={styles.item}
                      onClick={handleMention(participant)}
                      data-testid="chat-users-mention-user"
                    >
                      <UserAvatar
                        name={getUserName(participant)}
                        avatar={participant.meta?.user_avatar}
                        size={20}
                      />
                      <Typography
                        variant="bodyMedium"
                        sx={styles.name}
                        data-testid="chat-users-mention-name"
                      >
                        {getUserName(participant)}
                      </Typography>
                      {isOwner(participant) && (
                        <Typography
                          variant="bodySmall"
                          sx={styles.ownerBadge}
                          data-testid="chat-users-mention-owner"
                        >
                          Owner
                        </Typography>
                      )}
                      <Box
                        className="mention-icon"
                        sx={styles.at}
                      >
                        <AtIcon />
                      </Box>
                    </MenuItem>
                  ))}
                  {!filtered.length && !showEveryone && !showMe && (
                    <Typography
                      variant="bodyMedium"
                      sx={styles.empty}
                      data-testid="chat-users-mention-empty"
                    >
                      {others.length ? 'No matches found' : 'No one else is in this chat yet'}
                    </Typography>
                  )}
                </MenuList>
              </Box>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
});

UsersMentionDropdown.displayName = 'UsersMentionDropdown';

/** @type {MuiSx} */
const usersMentionDropdownStyles = width => ({
  popper: ({ zIndex }) => ({
    zIndex: zIndex.modal ? zIndex.modal + 10 : 2200,
  }),
  paper: ({ palette }) => ({
    width: width ? `${width / 16}rem` : '15.5rem',
    borderRadius: DropdownConstants.BORDER_RADIUS.MENU,
    border: `0.0625rem solid ${palette.border.lines}`,
    background: palette.background.default.secondary,
    overflow: 'hidden',
  }),
  search: ({ palette }) => ({
    padding: '0.25rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  searchBar: {
    height: '2rem',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    '&:hover, &:focus-within': { border: 'none', backgroundColor: 'transparent' },
  },
  list: {
    padding: '0.25rem 0',
    maxHeight: '15rem',
    overflowY: 'auto',
  },
  item: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    height: DropdownConstants.DIMENSIONS.ITEM_HEIGHT,
    padding: '0.5rem 0.75rem 0.5rem 1rem',
    '&:hover, &.Mui-focusVisible': { backgroundColor: palette.background.interactiveItem.hover },
    '&:hover .mention-icon, &.Mui-focusVisible .mention-icon': { visibility: 'visible' },
  }),
  // Your own row: in the list, but not a mention target, so no hover and no "@"
  meItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    height: DropdownConstants.DIMENSIONS.ITEM_HEIGHT,
    padding: '0.5rem 0.75rem 0.5rem 1rem',
    '&.Mui-disabled': { opacity: 1 },
  },
  meName: ({ palette }) => ({
    flex: '0 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  you: ({ palette }) => ({
    flexShrink: 0,
    marginLeft: '-0.25rem',
    color: palette.text.primary,
  }),
  // The Owner badge of the Share window
  ownerBadge: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.125rem 0.375rem',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.metrics,
    textTransform: 'none',
  }),
  meOwnerBadge: {
    marginLeft: 'auto',
  },
  everyoneAvatar: ({ palette }) => ({
    width: '1.25rem',
    height: '1.25rem',
    backgroundColor: palette.primary.main,
    color: palette.primary.contrastText,
  }),
  everyoneIcon: {
    fontSize: '0.75rem',
  },
  name: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  at: ({ palette }) => ({
    visibility: 'hidden',
    display: 'flex',
    color: palette.icon.default,
    '& svg': { width: '1rem', height: '1rem' },
  }),
  empty: ({ palette }) => ({
    padding: '0.5rem 1rem',
    color: palette.text.primary,
  }),
});

export default UsersMentionDropdown;
