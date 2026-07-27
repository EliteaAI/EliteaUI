import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress, Grid, Typography } from '@mui/material';

import { RunHistoryContainer } from '@/[fsd]/entities/run-history/ui';
import { ParticipantEntityTypes } from '@/[fsd]/features/chat/participants/lib/constants/participant.constants';
import { IndexesContainer } from '@/[fsd]/features/toolkits/indexes/ui';
import { TestTools } from '@/[fsd]/features/toolkits/ui';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui/form/ToolkitForm';
import { useShowRunHistoryFromUrl } from '@/[fsd]/shared/lib/hooks';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import DirtyDetector from '@/components/Formik/DirtyDetector.jsx';
import { CONFIGURATION_VIEW_OPTIONS } from '@/pages/Applications/Components/Tools/ToolConfigurationForm.jsx';

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
    selectedIndexTools,
    indexingUnavailableReason,
    shouldHideIndexes,
  } = props;
  const [showHistory, setShowHistory] = useState(false);
  useShowRunHistoryFromUrl({ setShowHistory });

  const onChangeToolDetail = useCallback(
    (updater, options) => {
      if (!options?.isAutoSelect) {
        setIsToolDirty(!!updater);
      }
      setEditToolDetail(updater);
    },
    [setEditToolDetail, setIsToolDirty],
  );

  const handleShowHistory = useCallback(() => {
    setShowHistory(true);
  }, []);

  const [isFullScreenChat, setIsFullScreenChat] = useState(false);

  const indexesAccordionContent = (() => {
    if (indexingUnavailableReason) {
      return (
        <Box sx={styles.indexesUnavailable}>
          <Typography
            variant="bodyMedium"
            color="text.default"
          >
            Indexing is not available for now
          </Typography>
        </Box>
      );
    }

    return (
      <IndexesContainer
        listOnly
        toolkitId={toolkitId}
        selectedIndexTools={selectedIndexTools}
        editToolDetail={editToolDetail}
      />
    );
  })();

  return isFetching ? (
    <Box
      sx={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <CircularProgress />
    </Box>
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
              {!shouldHideIndexes && (
                <BasicAccordion
                  data-testid="toolkit-indexes-accordion"
                  style={styles.indexesAccordionWrapper}
                  accordionSX={styles.indexesAccordion}
                  items={[
                    {
                      title: 'Indexes',
                      content: indexesAccordionContent,
                    },
                  ]}
                />
              )}
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
    overflow: 'auto',
    maxHeight: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  rightPanel: {
    height: '100%',
    maxHeight: '100%',
  },
  indexesAccordionWrapper: {
    width: '100%',
  },
  indexesAccordion: {
    width: '100%',
  },
  indexesUnavailable: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    background: palette.background.userInputBackground,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
};

export default ConfigurationTab;
