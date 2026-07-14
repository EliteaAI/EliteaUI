import { memo } from 'react';

import { Box, Typography } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

import UserAvatar from '@/components/UserAvatar';

const ProfileUserInfo = memo(props => {
  const { name, avatar, isFetching } = props;

  const styles = profileUserInfoStyles();

  if (isFetching) {
    return (
      <Box sx={styles.container}>
        <Skeleton
          variant="rectangular"
          width={100}
          height={20}
          sx={styles.nameSkeleton}
        />
        <Skeleton
          variant="circular"
          width={32}
          height={32}
        />
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Typography
        variant="bodyMedium"
        color="text.secondary"
      >
        {name}
      </Typography>
      <UserAvatar
        avatar={avatar}
        name={name}
        size={32}
      />
    </Box>
  );
});

ProfileUserInfo.displayName = 'ProfileUserInfo';

/** @type {MuiSx} */
const profileUserInfoStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  nameSkeleton: {
    borderRadius: '0.25rem',
  },
});

export default ProfileUserInfo;
