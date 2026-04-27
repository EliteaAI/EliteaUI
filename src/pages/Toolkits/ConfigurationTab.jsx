import { memo, useCallback, useState } from 'react';

import { CircularProgress, Grid } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/lib/constants/participant.constants';
import { TestTools } from '@/[fsd]/features/toolkits/ui';
import { useShowRunHistoryFromUrl } from '@/[fsd]/shared/lib/hooks';
import DirtyDetector from '@/components/Formik/DirtyDetector.jsx';
import { CONFIGURATION_VIEW_OPTIONS } from '@/pages/Applications/Components/Tools/ToolConfigurationForm.jsx';
import ToolkitForm from '@/pages/Toolkits/ToolkitForm.jsx';

const ConfigurationTab = memo(props => {
  const {
    isFetching,
    applicationId,
    setDirty,
    editToolDetail,
    setEditToolDetail,
    isToolDirty,
    setIsToolDirty,
    toolkitId,
    editFieldRootPath = 'settings',
    hasNotSavedCredentials,
    updateKey,
    isMCP,
    onValidationStateChange,
  } = props;
  const [showHistory, setShowHistory] = useState(false);
  useShowRunHistoryFromUrl({ setShowHistory });

  const onChangeToolDetail = useCallback(
    (...args) => {
      setIsToolDirty(!!args[0]);
      setEditToolDetail(args[0]);
    },
    [setEditToolDetail, setIsToolDirty],
  );

  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const [isFullScreenChat, setIsFullScreenChat] = useState(false);

  return isFetching ? (
    <CircularProgress />
  ) : (
    <>
      <DirtyDetector setDirty={setDirty} />
      {showHistory && (
        <RunHistoryContainer
          entityId={toolkitId}
          source={isMCP ? ParticipantEntityTypes.MCP : ParticipantEntityTypes.Toolkit}
          versions={null}
          onClose={() => setShowHistory(false)}
        />
      )}
      {!showHistory && (
        <Grid
          container
          columnSpacing={'2rem'}
          sx={styles.gridContainer}
        >
          {editToolDetail && !isFullScreenChat && (
            <Grid
              size={{ md: 12, lg: 4 }}
              sx={styles.leftPanel}
            >
              <ToolkitForm
                editToolDetail={editToolDetail}
                onChangeToolDetail={onChangeToolDetail}
                isEditing={true}
                isToolDirty={isToolDirty}
                editFieldRootPath={editFieldRootPath}
                isCustomBackButtons={true}
                showNameFieldForcedly={true}
                showToolkitIcon={true}
                hideConfigurationNameInput={true}
                configurationViewOptions={CONFIGURATION_VIEW_OPTIONS.CredentialsSelect}
                hasNotSavedCredentials={hasNotSavedCredentials}
                updateKey={updateKey}
                isMCP={isMCP}
                onSyntaxError={() => {}}
                onValidationStateChange={onValidationStateChange}
              />
            </Grid>
          )}
          <Grid
            size={{ md: 12, lg: !editToolDetail || isFullScreenChat ? 12 : 8 }}
            sx={styles.rightPanel}
            container
          >
            <TestTools
              isFullScreenChat={isFullScreenChat}
              setIsFullScreenChat={setIsFullScreenChat}
              applicationId={applicationId}
              toolkitId={toolkitId}
              onShowHistory={handleShowHistory}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';

/** @type {MuiSx} */
const styles = {
  gridContainer: {
    height: '100%',
    maxHeight: '100%',
    paddingTop: '1rem',
    paddingBottom: '1.5rem',
    paddingLeft: '1.5rem !important',
    paddingRight: '1.5rem !important',
  },
  leftPanel: {
    overflow: 'scroll',
    maxHeight: '100%',
    height: '100%',
  },
  rightPanel: {
    height: '100%',
    maxHeight: '100%',
  },
};

export default ConfigurationTab;
