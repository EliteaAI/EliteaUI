import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import UserAvatar from '@/components/UserAvatar';

const UserMentionItem = memo(props => {
  const { user, onClick, isActive } = props;

  const handleClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();
      onClick(user);
    },
    [onClick, user],
  );

  const avatarName = user.participant?.meta?.user_name || user.name;
  const avatarSrc = user.participant?.meta?.user_avatar;

  return (
    <Box
      onClick={handleClick}
      sx={userMentionItemStyles.item(isActive)}
    >
      <UserAvatar
        name={avatarName}
        avatar={avatarSrc}
        size={24}
      />
      <Typography
        variant="headingSmall"
        color="text.secondary"
        sx={userMentionItemStyles.name}
      >
        {user.name}
      </Typography>
    </Box>
  );
});

UserMentionItem.displayName = 'UserMentionItem';

const UserMentionList = memo(props => {
  const { users = [], query, onSelectUser, onClose } = props;

  const [activeIndex, setActiveIndex] = useState(0);

  const filteredUsers = useMemo(() => {
    if (!users.length) return [];
    const searchStr = query?.slice(1)?.toLowerCase() || '';
    if (!searchStr) return users;
    return users.filter(u => u.name?.toLowerCase().includes(searchStr));
  }, [users, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredUsers]);

  useEffect(() => {
    if (!filteredUsers.length) return;

    const handleKeyDown = event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        onSelectUser(filteredUsers[activeIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [filteredUsers, activeIndex, onSelectUser]);

  if (!filteredUsers.length) return null;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Box sx={userMentionListStyles.container}>
        <Box sx={userMentionListStyles.header}>
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            Participants
          </Typography>
        </Box>
        <Box sx={userMentionListStyles.list}>
          {filteredUsers.map((user, index) => (
            <UserMentionItem
              key={user.id}
              user={user}
              onClick={onSelectUser}
              isActive={index === activeIndex}
            />
          ))}
        </Box>
      </Box>
    </ClickAwayListener>
  );
});

UserMentionList.displayName = 'UserMentionList';

/** @type {MuiSx} */
const userMentionItemStyles = {
  item:
    isActive =>
    ({ palette }) => ({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.375rem 0.5rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      backgroundColor: isActive ? palette.action.hover : 'transparent',
      '&:hover': {
        backgroundColor: palette.action.hover,
      },
    }),
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

/** @type {MuiSx} */
const userMentionListStyles = {
  container: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    width: '100%',
    maxWidth: '100%',
    maxHeight: '15.4375rem',
    borderRadius: '1rem',
    boxSizing: 'border-box',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    background: palette.background.secondary,
    overflowY: 'auto',
  }),
  header: {
    height: '1rem',
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.5rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
};

export default UserMentionList;
