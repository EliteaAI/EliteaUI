import { memo } from 'react';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { useSoundNotification } from '@/[fsd]/shared/lib/hooks';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';

import { SoundNotificationControls } from './SoundNotificationControls';

const SoundNotificationSection = memo(() => {
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

SoundNotificationSection.displayName = 'SoundNotificationSection';

export { SoundNotificationSection };

/** @type {MuiSx} */
const styles = {
  accordion: {
    background: 'transparent !important',
    paddingTop: '0rem',
  },
};
