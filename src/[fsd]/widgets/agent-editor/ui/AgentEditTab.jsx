import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { useViewMode } from '@/[fsd]/shared/lib/hooks';
import DirtyDetector from '@/components/Formik/DirtyDetector';

import AgentEditorWorkspace from './AgentEditorWorkspace';

const AgentEditTab = memo(props => {
  const {
    isFetching,
    isError,
    applicationId,
    setDirty,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
    isTestPanelOpen,
    onOpenTestPanel,
    onCloseTestPanel,
    isFullScreen,
    setIsFullScreen,
  } = props;

  const viewMode = useViewMode();
  const styles = agentEditTabStyles();

  if (isError) {
    return (
      <Box sx={styles.centered}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Failed to load data! Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  if (isFetching) {
    return (
      <Box sx={styles.centered}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <DirtyDetector setDirty={setDirty} />
      <AgentEditorWorkspace
        applicationId={applicationId}
        viewMode={viewMode}
        unsavedLLMSettings={unsavedLLMSettings}
        setUnsavedLLMSettings={setUnsavedLLMSettings}
        isTestPanelOpen={isTestPanelOpen}
        onOpenTestPanel={onOpenTestPanel}
        onCloseTestPanel={onCloseTestPanel}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
      />
    </>
  );
});

AgentEditTab.displayName = 'AgentEditTab';

/** @type {MuiSx} */
const agentEditTabStyles = () => ({
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
});

export default AgentEditTab;
