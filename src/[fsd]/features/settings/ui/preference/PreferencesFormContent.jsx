import { memo } from 'react';

import { Box } from '@mui/material';

import { VoicePersonalizationSection } from '@/[fsd]/features/chat/ui';
import PreferenceGeneral from '@/[fsd]/features/settings/ui/preference/PreferenceGeneral';
import { SoundNotificationSection } from '@/[fsd]/pages/user-settings/ui/SoundNotificationSection';

const PreferencesFormContent = memo(() => {
  const styles = preferencesFormContentStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.container}>
        <PreferenceGeneral />
        <VoicePersonalizationSection />
        <SoundNotificationSection />
      </Box>
    </Box>
  );
});

PreferencesFormContent.displayName = 'PreferencesFormContent';

/** @type {MuiSx} */
const preferencesFormContentStyles = () => ({
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1.5rem',
    maxWidth: '50rem',
    width: '100%',
  },
});

export default PreferencesFormContent;
