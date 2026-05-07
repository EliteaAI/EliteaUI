import { memo, useCallback, useMemo, useRef } from 'react';

import { Box, useTheme } from '@mui/material';

import MainPanel from '@/[fsd]/app/layout/MainPanel';
import MainSidebar from '@/[fsd]/app/layout/MainSidebar';
import { DEV, ELITEA_ASSISTANT_ENABLED, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix } from '@/common/utils';
import { EliteaAssistant } from '@eliteaai/elitea-assistant';

const AppLayout = memo(() => {
  const assistantRef = useRef(null);

  const styles = appLayoutStyles();
  const theme = useTheme();

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
    <Box sx={styles.appContainer}>
      <MainSidebar onToggleAssistant={showEliteaAssistant ? onToggleAssistant : undefined} />
      <MainPanel />

      {showEliteaAssistant && (
        <EliteaAssistant
          ref={assistantRef}
          apiUrl={`${clearBaseUrlPrefix(VITE_SERVER_URL)}/support_assistant`}
          token={DEV ? VITE_DEV_TOKEN : undefined}
          withCredentials={!DEV}
          position="bottom-left"
          theme={theme.palette.mode}
        />
      )}
    </Box>
  );
});

AppLayout.displayName = 'AppLayout';

/** @type {MuiSx} */
const appLayoutStyles = () => ({
  appContainer: {
    display: 'flex',
  },
});

export default AppLayout;
