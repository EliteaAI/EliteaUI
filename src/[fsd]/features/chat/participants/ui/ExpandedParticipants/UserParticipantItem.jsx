import { memo, useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import UserAvatar from '@/components/UserAvatar';

const UserParticipantItem = memo(props => {
  const { participant, onClickItem, clickable = true } = props;

  const user = useSelector(state => state.user);

  const {
    meta: { user_name, user_avatar } = { user_name: '', user_avatar: '' },
    entity_meta: { id: participant_user_id } = {},
  } = participant;

  const isOtherUser = user?.id != participant_user_id;

  const [, setIsHovering] = useState(false);

  const styles = userParticipantItemStyles({ isOtherUser });

  const onClickHandler = useCallback(() => {
    if (isOtherUser) onClickItem?.(participant);
  }, [onClickItem, participant, isOtherUser]);

  return (
    <Tooltip
      title={isOtherUser ? `Mention ${user_name}` : ''}
      placement="top"
    >
      <Box
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        sx={styles.root}
      >
        <UserAvatar
          name={user_name}
          avatar={user_avatar}
          size={28}
        />
        <Box
          id="cover"
          onClick={clickable ? onClickHandler : undefined}
          visibility="hidden"
          sx={styles.cover}
        >
          <Typography
            variant="headingSmall"
            color="text.secondary"
            sx={styles.coverText}
          >
            @
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
});

UserParticipantItem.displayName = 'UserParticipantItem';

/** @type {MuiSx} */
const userParticipantItemStyles = ({ isOtherUser }) => ({
  root: ({ palette }) => ({
    cursor: isOtherUser ? 'pointer' : 'default',
    padding: 0,
    borderRadius: '1.75rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '1.75rem',
    height: '1.75rem',
    boxSizing: 'border-box',
    position: 'relative',
    ':hover': {
      background: palette.background.participant.hover,
    },
    '&:hover #cover': {
      visibility: isOtherUser ? 'visible' : 'hidden',
    },
  }),
  cover: ({ palette }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
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
});

export default UserParticipantItem;
