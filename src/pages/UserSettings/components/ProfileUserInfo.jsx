import { memo } from 'react';

import { Box, Typography } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

import UserAvatar from '@/components/UserAvatar';

const ProfileUserInfo = memo(props => {
  const { name, avatar, email, isFetching } = props;

  const styles = profileUserInfoStyles();

  if (isFetching) {
    return (
      <Box sx={styles.container}>
        <Box sx={styles.textContainer}>
          <Skeleton
            variant="circular"
            width={36}
            height={36}
          />
          <Skeleton
            variant="rectangular"
            width={160}
            height={24}
            sx={styles.nameSkeleton}
          />
          <Skeleton
            variant="rectangular"
            width={200}
            height={18}
            sx={styles.emailSkeleton}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.textContainer}>
        <UserAvatar
          avatar={avatar}
          name={name}
          size={36}
        />
        <Typography
          variant="headingSmall"
          color="text.secondary"
          sx={styles.nameText}
        >
          {name}
        </Typography>
        {email && (
          <Typography
            variant="bodySmall"
            color="text.primary"
            sx={styles.emailText}
          >
            {email}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

ProfileUserInfo.displayName = 'ProfileUserInfo';

/** @type {MuiSx} */
const profileUserInfoStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  nameText: {
    marginTop: '0.5rem',
  },
  nameSkeleton: {
    marginTop: '0.5rem',
  },
  emailText: {
    marginTop: '0.25rem',
  },
  emailSkeleton: {
    marginTop: '0.625rem',
  },
});

export default ProfileUserInfo;
