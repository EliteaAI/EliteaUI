import { memo, useCallback, useMemo, useRef } from 'react';

import { useTheme } from '@mui/material';

import { DEV, ELITEA_ASSISTANT_ENABLED, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix } from '@/common/utils';
import { EliteaAssistant } from '@eliteaai/elitea-assistant';

import { EliteaAssistantProvider } from '../lib/context';
import { useAssistantContext } from '../lib/hooks';

const SupportAssistantWidget = memo(({ children }) => {
  const assistantRef = useRef(null);
  const theme = useTheme();
  const assistantContext = useAssistantContext();

  const onToggleAssistant = useCallback(() => {
    assistantRef.current?.toggle();
  }, []);

  const showEliteaAssistant = useMemo(() => {
    if (typeof ELITEA_ASSISTANT_ENABLED === 'string')
      return (
        ELITEA_ASSISTANT_ENABLED.toLowerCase() === '1' || ELITEA_ASSISTANT_ENABLED.toLowerCase() === 'true'
      );

    return Boolean(ELITEA_ASSISTANT_ENABLED);
  }, []);

  return (
    <EliteaAssistantProvider assistantRef={assistantRef}>
      {children({ onToggleAssistant: showEliteaAssistant ? onToggleAssistant : undefined })}

      {showEliteaAssistant && (
        <EliteaAssistant
          ref={assistantRef}
          apiUrl={`${clearBaseUrlPrefix(VITE_SERVER_URL)}/support_assistant`}
          token={DEV ? VITE_DEV_TOKEN : undefined}
          withCredentials={!DEV}
          position="bottom-left"
          theme={theme.palette.mode}
          supportAssistantContext={assistantContext}
        />
      )}
    </EliteaAssistantProvider>
  );
});

SupportAssistantWidget.displayName = 'SupportAssistantWidget';

export default SupportAssistantWidget;
