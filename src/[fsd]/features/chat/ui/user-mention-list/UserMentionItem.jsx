import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

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
      sx={styles.item(isActive)}
    >
      <UserAvatar
        name={avatarName}
        avatar={avatarSrc}
        size={24}
      />
      <Typography
        variant="headingSmall"
        color="text.secondary"
        sx={styles.name}
      >
        {user.name}
      </Typography>
    </Box>
  );
});

UserMentionItem.displayName = 'UserMentionItem';

/** @type {MuiSx} */
const styles = {
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

export default UserMentionItem;
