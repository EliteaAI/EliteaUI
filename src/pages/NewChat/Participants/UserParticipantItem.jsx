import { useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography, useTheme } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import UserAvatar from '@/components/UserAvatar';

const UserParticipantItem = ({ participant = {}, clickable = true, onClickItem }) => {
  const user = useSelector(state => state.user);
  const {
    meta: { user_name, user_avatar } = { user_name: '', user_avatar: '' },
    entity_meta: { id: participant_user_id } = {},
  } = participant;
  const theme = useTheme();

  const [, setIsHovering] = useState(false);

  const onClickHandler = useCallback(() => {
    if (user?.id != participant_user_id) {
      onClickItem?.(participant);
    }
  }, [onClickItem, participant, participant_user_id, user?.id]);

  const onMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <Tooltip
      title={user?.id != participant_user_id ? `Mention ${user_name}` : ''}
      placement="top"
    >
      <Box
        // onClick={onClickHandler}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={{
          cursor: user?.id != participant_user_id ? 'pointer' : 'default',
          padding: '0 0',
          borderRadius: '28px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          width: '28px',
          height: '28px',
          boxSizing: 'border-box',
          position: 'relative',
          ':hover': {
            background: theme.palette.background.participant.hover,
          },
          '&:hover #cover': {
            visibility: user?.id != participant_user_id ? 'visible' : 'hidden',
          },
        }}
      >
        <UserAvatar
          name={user_name}
          avatar={user_avatar}
          size={28}
        />
        <Box
          id={'cover'}
          onClick={clickable ? onClickHandler : undefined}
          visibility={'hidden'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: theme.palette.background.participant.cover,
            borderRadius: '28px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="headingSmall"
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            @
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default UserParticipantItem;
