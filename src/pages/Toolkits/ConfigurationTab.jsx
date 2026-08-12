import { memo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress, Grid } from '@mui/material';

import { TestTools } from '@/[fsd]/features/toolkits/ui';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui/form/ToolkitForm';
import DirtyDetector from '@/components/Formik/DirtyDetector.jsx';
import RouteDefinitions from '@/routes';

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
    indexingUnavailableReason,
    shouldHideIndexes = true,
  } = props;
  const navigate = useNavigate();

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
    navigate(
      `${RouteDefinitions.ToolkitRunHistory.replace(':tab', 'all').replace(':toolkitId', String(toolkitId))}?isMCP=${isMCP}`,
    );
  }, [isMCP, navigate, toolkitId]);

  return isFetching ? (
    <Box
      sx={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <CircularProgress />
    </Box>
  ) : (
    <>
      <DirtyDetector setDirty={setDirty} />
      <>
        <Grid
          container
          // columnSpacing={'2rem'}
          sx={styles.gridContainer}
        >
          {editToolDetail && (
            <Grid
              size={{ md: 12, lg: 6 }}
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
                hasNotSavedCredentials={hasNotSavedCredentials}
                updateKey={updateKey}
                isMCP={isMCP}
                onSyntaxError={() => {}}
                onValidationStateChange={onValidationStateChange}
                shouldHideIndexes={shouldHideIndexes}
                indexingUnavailableReason={indexingUnavailableReason}
                toolkitId={toolkitId}
                handleShowHistory={handleShowHistory}
              />
            </Grid>
          )}
          <Grid
            size={{ md: 12, lg: 6 }}
            sx={styles.rightPanel}
            container
          >
            <TestTools
              applicationId={applicationId}
              toolkitId={toolkitId}
            />
          </Grid>
        </Grid>
      </>
    </>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';

/** @type {MuiSx} */
const styles = {
  gridContainer: {
    height: '100%',
    maxHeight: '100%',
    paddingTop: '0rem',
    paddingBottom: '0rem',
    paddingLeft: '0rem !important',
    paddingRight: '0rem !important',
  },
  leftPanel: {
    overflow: 'auto',
    maxHeight: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem 1.5rem',
    borderRight: ({ palette }) => `0.0625rem solid ${palette.border.table}`,
    position: 'relative',
    background: ({ palette }) => palette.background.toolkitDetailLeftPanel,
    ' & .MuiAccordion-root': {
      background: ({ palette }) => `${palette.background.toolkitDetailLeftPanel} !important`,
    },

    '>div': {
      maxWidth: { lg: 'unset', xs: '40.1875rem' },
      margin: { lg: 'unset', xs: '0 auto' },
    },
  },
  rightPanel: {
    height: '100%',
    maxHeight: '100%',
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
