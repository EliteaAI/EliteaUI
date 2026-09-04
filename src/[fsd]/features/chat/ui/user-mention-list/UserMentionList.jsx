import { memo, useEffect, useMemo, useState } from 'react';

import { Box, ClickAwayListener, Typography } from '@mui/material';

import UserMentionItem from '@/[fsd]/features/chat/ui/user-mention-list/UserMentionItem';

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
      <Box
        sx={styles.container}
        data-testid="chat-user-mention-list"
      >
        <Box sx={styles.header}>
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            Participants
          </Typography>
        </Box>
        <Box sx={styles.list}>
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
const styles = {
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
    background: palette.background.default.secondary,
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
