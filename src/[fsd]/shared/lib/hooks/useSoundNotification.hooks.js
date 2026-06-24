import { useCallback, useState } from 'react';

import {
  loadSoundConfig,
  playCompletionSound,
  playErrorSound,
  saveSoundConfig,
} from '@/[fsd]/shared/lib/utils/soundNotification.utils';

const useSoundNotification = () => {
  const [config, setConfigState] = useState(loadSoundConfig);

  const setConfig = useCallback(updates => {
    setConfigState(prev => {
      const next = { ...prev, ...updates };
      saveSoundConfig(next);
      return next;
    });
  }, []);

  return { config, setConfig, playCompletionSound, playErrorSound };
};

export { useSoundNotification };
