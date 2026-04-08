import { memo } from 'react';

import { Box } from '@mui/material';

import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';

import {
  ProfileContextManagement,
  ProfileLongTermMemory,
  ProfilePersonalization,
  ProfileSummarization,
  ProfileUserInfo,
} from './components';

const ProfileFormContent = memo(props => {
  const { name, avatar, email, isFetching, modelList } = props;

  const styles = profileFormContentStyles();

  const { onBlur, requestSubmit } = useFormikAutoSaveOnBlur();

  return (
    <Box
      sx={styles.wrapper}
      onBlur={onBlur}
    >
      <Box sx={styles.container}>
        <ProfileUserInfo
          name={name}
          avatar={avatar}
          email={email}
          isFetching={isFetching}
        />
        <ProfilePersonalization onAutoSaveRequested={requestSubmit} />
        <ProfileContextManagement />
        <ProfileSummarization modelList={modelList} />
        <ProfileLongTermMemory />
      </Box>
    </Box>
  );
});

ProfileFormContent.displayName = 'ProfileFormContent';

/** @type {MuiSx} */
const profileFormContentStyles = () => ({
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    maxWidth: '37.5rem',
    width: '100%',
  },
});

export default ProfileFormContent;
