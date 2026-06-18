import { memo, useCallback, useMemo, useState } from 'react';

import { Box, MenuItem, MenuList, Typography } from '@mui/material';

import UserAvatar from '@/components/UserAvatar';

import DeleteParticipantButton from '../ParticipantActions/DeleteParticipantButton';

const UserMenu = memo(props => {
  const { options, onClickEvent, onSelectOption, width, onRemoveOption, currentUserId, selectable, sx } =
    props;

  const [hoveredUserId, setHoveredUserId] = useState(null);

  const sortedUsers = useMemo(() => {
    return options.sort((a, b) =>
      a.meta?.user_name?.toLowerCase().localeCompare(b.meta?.user_name?.toLowerCase()),
    );
  }, [options]);

  const onClick = useCallback(
    (event, participant) => {
      onSelectOption?.(participant);
      onClickEvent(event, true);
    },
    [onClickEvent, onSelectOption],
  );

  return (
    <MenuList sx={[styles.list, sx]}>
      {sortedUsers.map(user => {
        const { user_name, user_avatar } = user.meta || { user_name: '', user_avatar: '' };
        const isSelectable = selectable && user.entity_meta?.id !== currentUserId;
        const isHovering = hoveredUserId === user.id;
        const itemStyles = userItemStyles({ width, selectable: isSelectable, isHovering });

        return (
          <MenuItem
            sx={styles.menuItem}
            disableRipple
            key={user.id}
          >
            <Box
              onMouseEnter={() => setHoveredUserId(user.id)}
              onMouseLeave={() => setHoveredUserId(null)}
              sx={itemStyles.root}
            >
              <Box
                sx={itemStyles.contentRow}
                onClick={isSelectable ? e => onClick(e, user) : undefined}
              >
                <UserAvatar
                  name={user_name}
                  avatar={user_avatar}
                  size={20}
                />
                <Box
                  id="cover"
                  visibility="hidden"
                  sx={itemStyles.cover}
                >
                  <Typography
                    variant="labelSmall"
                    color="text.secondary"
                    sx={itemStyles.coverText}
                  >
                    @
                  </Typography>
                </Box>
                <Typography
                  color="text.secondary"
                  variant="bodyMedium"
                  sx={itemStyles.userName}
                >
                  {user_name}
                </Typography>
              </Box>
              <DeleteParticipantButton
                id="DeleteButton"
                sx={itemStyles.deleteButton}
                participant={user}
                onDelete={onRemoveOption}
              />
            </Box>
          </MenuItem>
        );
      })}
    </MenuList>
  );
});

UserMenu.displayName = 'UserMenu';

/** @type {MuiSx} */
const userItemStyles = ({ width, selectable, isHovering }) => ({
  root: {
    cursor: selectable ? 'pointer' : 'default',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: '.5rem 1rem',
    width,
    maxWidth: width,
    height: '2.5rem',
    boxSizing: 'border-box',
    '&:hover #cover': {
      visibility: selectable ? 'visible' : 'hidden',
    },
    '&:hover #DeleteButton': {
      visibility: selectable ? 'visible' : 'hidden',
    },
  },
  contentRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    height: '1.25rem',
    boxSizing: 'border-box',
    borderRadius: '1.25rem',
    position: 'relative',
    gap: '.8125rem',
  },
  cover: ({ palette }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '1.25rem',
    height: '100%',
    backgroundColor: palette.background.participant.cover,
    borderRadius: '1.75rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  coverText: {
    textAlign: 'center',
  },
  userName: {
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordWrap: 'break-word',
    maxWidth: isHovering ? `calc(${width} - 6.5rem)` : `calc(${width} - 4.125rem)`,
  },
  deleteButton: {
    visibility: 'hidden',
  },
});

/** @type {MuiSx} */
const styles = {
  list: {
    padding: '0 0 .5rem 0',
  },
  menuItem: {
    justifyContent: 'space-between',
    padding: '0 !important',
  },
};

export default UserMenu;
