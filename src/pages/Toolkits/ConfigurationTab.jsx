import { memo, useCallback, useMemo } from 'react';

import { Box, CircularProgress, Grid, Typography } from '@mui/material';

import { IndexesPanel } from '@/[fsd]/features/toolkits/indexes/ui';
import { useToolkitDetailNavigation } from '@/[fsd]/features/toolkits/lib/hooks';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui/form/ToolkitForm';
import DirtyDetector from '@/components/Formik/DirtyDetector.jsx';

const ConfigurationTab = memo(props => {
  const {
    isFetching,
    hasLoadError,
    setDirty,
    dirty,
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
    indexingBlocker,
    shouldHideIndexes = true,
  } = props;
  const { goToRunHistory, goToTest } = useToolkitDetailNavigation({ toolkitId, isMCP });

  const hasSidePanel = !shouldHideIndexes;
  const styles = useMemo(() => configurationTabStyles(hasSidePanel), [hasSidePanel]);

  const onChangeToolDetail = useCallback(
    (updater, options) => {
      if (!options?.isAutoSelect) {
        setIsToolDirty(!!updater);
      }
      setEditToolDetail(updater);
    },
    [setEditToolDetail, setIsToolDirty],
  );

  if (isFetching || (!editToolDetail && !hasLoadError)) {
    return (
      <Box sx={styles.fullPanelState}>
        <CircularProgress />
      </Box>
    );
  }

  if (!editToolDetail) {
    return (
      <Box sx={styles.fullPanelState}>
        <Typography
          variant="bodyMedium"
          color="text.primary"
        >
          This toolkit could not be loaded.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <DirtyDetector setDirty={setDirty} />
      <Grid
        container
        sx={styles.gridContainer}
      >
        <Grid
          size={{ md: 12, lg: hasSidePanel ? 6 : 12 }}
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
            hideConfigurationNameInput={true}
            hasNotSavedCredentials={hasNotSavedCredentials}
            updateKey={updateKey}
            isMCP={isMCP}
            onSyntaxError={() => {}}
            onValidationStateChange={onValidationStateChange}
            hasSidePanel={hasSidePanel}
            handleShowHistory={goToRunHistory}
            handleShowTest={goToTest}
            isTestDisabled={dirty}
          />
        </Grid>
        {hasSidePanel && (
          <Grid
            size={{ md: 12, lg: 6 }}
            sx={styles.rightPanel}
          >
            <IndexesPanel
              toolkitId={toolkitId}
              indexingBlocker={indexingBlocker}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';

/** @type {MuiSx} */
const configurationTabStyles = hasSidePanel => ({
  gridContainer: {
    height: '100%',
    maxHeight: '100%',
    paddingTop: '0rem',
    paddingBottom: '0rem',
    paddingLeft: '0rem !important',
    paddingRight: '0rem !important',
  },
  leftPanel: {
    overflow: 'hidden',
    maxHeight: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    borderRight: hasSidePanel ? ({ palette }) => `0.0625rem solid ${palette.border.table}` : 'none',
    position: 'relative',
    ' & .MuiAccordion-root': {
      background: 'transparent',
    },
  },
  rightPanel: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  fullPanelState: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConfigurationTab;
