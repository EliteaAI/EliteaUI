import { memo, useCallback, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { Box, CircularProgress, Grid } from '@mui/material';

import { IndexesContainer, RunIndexBanner } from '@/[fsd]/features/toolkits/indexes/ui';
import { TestTools } from '@/[fsd]/features/toolkits/ui';
import { ToolkitForm } from '@/[fsd]/features/toolkits/ui/form/ToolkitForm';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import InfoIcon from '@/assets/info.svg?react';
import DirtyDetector from '@/components/Formik/DirtyDetector.jsx';
import { CONFIGURATION_VIEW_OPTIONS } from '@/pages/Applications/Components/Tools/ToolConfigurationForm.jsx';
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
    shouldHideIndexes,
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

  const indexesAccordionContent = useMemo(() => {
    if (indexingUnavailableReason) {
      return (
        <RunIndexBanner
          banner={{
            severity: 'info',
            label: 'Indexing is not available for now',
            message: 'Enable the “Index data” tool to activate indexing and create indexes.',
          }}
          CustomIcon={() => <InfoIcon />}
          sx={styles.banner}
        />
      );
    }

    return <IndexesContainer toolkitId={toolkitId} />;
  }, [indexingUnavailableReason, toolkitId]);

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
              <Box sx={styles.historyButtonWrapper}>
                <ViewRunHistoryButton onShowHistory={handleShowHistory} />
              </Box>
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
                extraContent={
                  !shouldHideIndexes ? (
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
                  ) : null
                }
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
              onShowHistory={handleShowHistory}
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
  banner: {
    padding: '0rem !important',
  },
  historyButtonWrapper: {
    position: 'absolute',
    top: '1rem',
    right: '1.5rem',
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
  },
  rightPanel: {
    height: '100%',
    maxHeight: '100%',
  },
  indexesAccordionWrapper: {
    width: '100%',
    marginTop: '1rem',
  },
  indexesAccordion: {
    width: '100%',
    background: ({ palette }) => `${palette.background.tabPanel} !important`,
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
