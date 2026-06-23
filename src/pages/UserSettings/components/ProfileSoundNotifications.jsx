import { memo } from 'react';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useSoundNotification } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

import { SoundNotificationControls } from './SoundNotificationControls';

const ProfileSoundNotifications = memo(() => {
  const { config, setConfig, playCompletionSound } = useSoundNotification();

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Sound Notifications',
          content: (
            <SoundNotificationControls
              config={config}
              setConfig={setConfig}
              playCompletionSound={playCompletionSound}
            />
          ),
        },
      ]}
    />
  );
});

ProfileSoundNotifications.displayName = 'ProfileSoundNotifications';

export default ProfileSoundNotifications;

/** @type {MuiSx} */
const styles = {
  accordion: {
    background: 'transparent !important',
    paddingTop: '1rem',
  },
};
