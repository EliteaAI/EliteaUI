import React, { memo, useCallback, useEffect } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { rematchModels, rematchStorage } from '@/[fsd]/entities/import-wizard/lib/helpers';
import IWModalDetails from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalDetails';
import { ProjectSelectShowMode } from '@/[fsd]/features/project/lib/constants';
import { useLazyGetConfigurationsListQuery, useListModelsQuery } from '@/api';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import ProjectSelect from '@/components/ProjectSelect';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const IWModalContent = memo(props => {
  const { isForking, excludedProjectIds } = props;

  const selectedProjectId = useSelectedProjectId();
  const styles = iwModalContentStyles();

  const { values, ...formikProps } = useFormikContext();

  const [getStorages, { data: storages, isError: isStorageError, isSuccess: isStorageSuccess }] =
    useLazyGetConfigurationsListQuery();

  const {
    data: integrations,
    isError,
    isSuccess,
  } = useListModelsQuery(
    { projectId: selectedProjectId, include_shared: true },
    { skip: !selectedProjectId },
  );
  const {
    data: embeddingModelOptions,
    isError: isEmbeddingError,
    isEmbeddingSuccess,
  } = useListModelsQuery(
    { projectId: selectedProjectId, include_shared: true, section: 'embedding' },
    { skip: !selectedProjectId },
  );

  useEffect(() => {
    if (values.selectedProject?.id) {
      // Models are now fetched via regular query based on selectedProjectId
      // getModels(values.selectedProject.id);
      getStorages({ projectId: values.selectedProject.id, type: 's3' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.selectedProject?.id]);

  useEffect(() => {
    const updateModels = async () => {
      const newImportItems = rematchModels({
        importItems: values.importItems,
        modelOptions: integrations,
        embeddingModelOptions,
      });
      await formikProps.setFieldValue('importItems', newImportItems);
      await formikProps.setFieldValue('modelOptions', integrations);
      await formikProps.setFieldValue('embeddingModelOptions', embeddingModelOptions);
    };

    if (isSuccess && integrations && isEmbeddingSuccess && embeddingModelOptions) updateModels();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integrations, isSuccess, embeddingModelOptions, isEmbeddingSuccess]);

  useEffect(() => {
    const updateStorage = async () => {
      const storageOptions = storages.items.map(item => ({
        label: `${item.label}`,
        value: item.uuid,
      }));
      const newImportItems = rematchStorage(values.importItems, storageOptions);
      await formikProps.setFieldValue('importItems', newImportItems);
      await formikProps.setFieldValue('storageOptions', storageOptions);
    };
    if (isStorageSuccess) {
      updateStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storages, isStorageSuccess]);

  useEffect(() => {
    const updateModels = async () => {
      const newImportItems = rematchModels(values.importItems, integrations, embeddingModelOptions);
      await formikProps.setFieldValue('importItems', newImportItems);

      if (isError) await formikProps.setFieldValue('modelOptions', {});
      if (isEmbeddingError) await formikProps.setFieldValue('embeddingModelOptions', {});
    };

    if (isError || isEmbeddingError) updateModels();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, isEmbeddingError]);

  useEffect(() => {
    const updateStorage = async () => {
      const newImportItems = rematchStorage(values.importItems, []);

      await formikProps.setFieldValue('importItems', newImportItems);
      await formikProps.setFieldValue('storageOptions', []);
    };

    if (isStorageError) updateStorage();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStorageError]);

  const handleProjectSelectChange = useCallback(
    async value => {
      await formikProps.setFieldValue('selectedProject', value);
    },
    [formikProps],
  );

  return (
    <Box sx={styles.root}>
      <Box sx={styles.projectSelectorWrapper}>
        <Typography sx={[styles.label, { pb: '0.15rem' }]}>Project:</Typography>
        <Box sx={{ width: 'auto' }}>
          <ProjectSelect
            required
            forLocalUsage
            showValidation={false}
            displayEmpty
            showBorder={false}
            name="selectedProject"
            filterIds={excludedProjectIds}
            showMode={ProjectSelectShowMode.NormalMode}
            value={values.selectedProject}
            onChange={handleProjectSelectChange}
            usePrivateProjectAsDefaultSelected={!isForking}
            hasNoPreselectedProject={isForking}
            selectPlaceholder="Select project"
          />
        </Box>
      </Box>
      <Box sx={{ margin: '0.5rem 0 .75rem', maxHeight: '25rem', overflowY: 'auto' }}>
        <IWModalDetails
          isProjectSelected={values.selectedProject}
          isForking={isForking}
        />
      </Box>
      <Box sx={styles.notificationWrapper}>
        <AttentionIcon />
        <Typography sx={styles.warningMessage}>
          For any toolkits requiring authentication, you will need to manually provide the necessary
          credentials (API Keys, usernames, tokens, passwords).
        </Typography>
      </Box>
    </Box>
  );
});

IWModalContent.displayName = 'IWModalContent';

/** @type {MuiSx} */
const iwModalContentStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '12.5rem',
    justifyContent: 'flex-start',
  },
  projectSelectorWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '.5rem',
    position: 'relative',

    '::after': {
      content: '""',
      display: 'block',
      width: 'calc(100% + 3rem)',
      height: '.0625rem',
      backgroundColor: 'divider',
      position: 'absolute',
      bottom: '-.5rem',
      left: '-1.5rem',
    },
  },
  label: {
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  notificationWrapper: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: 'auto',
    padding: '.75rem 1rem',
    background: palette.background.warning8,
    border: `0.0625rem solid ${palette.background.warning40}`,
    borderRadius: '0.5rem',

    svg: {
      minWidth: '1rem',
      minHeight: '1rem',

      path: {
        fill: palette.background.warning,
      },
    },
  }),

  warningMessage: theme => ({
    fontWeight: 400,
    fontSize: '.75rem',
    lineHeight: '1rem',
    color: theme.palette.mode === 'light' ? theme.palette.icon.fill.attention : theme.palette.text.mcp.logout,
  }),
});

export default IWModalContent;
