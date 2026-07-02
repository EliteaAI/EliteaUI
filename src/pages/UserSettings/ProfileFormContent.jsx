import { memo } from 'react';

import { Box } from '@mui/material';

import { VoicePersonalizationSection } from '@/[fsd]/features/chat/ui';
import { SoundNotificationSection } from '@/[fsd]/pages/user-settings/ui/SoundNotificationSection';
import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';

import { ProfileContextManagement, ProfilePersonalization, ProfileUserInfo } from './components';

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
        <ProfileContextManagement
          modelList={modelList}
          onAutoSaveRequested={requestSubmit}
        />
        <VoicePersonalizationSection />
        <SoundNotificationSection />
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
    gap: '0.5rem',
    padding: '1.5rem',
    maxWidth: '50rem',
    width: '100%',
  },
});

export default ProfileFormContent;
