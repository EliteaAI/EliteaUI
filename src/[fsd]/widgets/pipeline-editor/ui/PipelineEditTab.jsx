import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import DirtyDetector from '@/components/Formik/DirtyDetector';

import PipelineEditorWorkspace from './PipelineEditorWorkspace';

const PipelineEditTab = memo(props => {
  const {
    isFetching,
    isError,
    applicationId,
    setDirty,
    setYamlDirty,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
  } = props;

  const styles = pipelineEditTabStyles();

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
      <PipelineEditorWorkspace
        applicationId={applicationId}
        setYamlDirty={setYamlDirty}
        unsavedLLMSettings={unsavedLLMSettings}
        setUnsavedLLMSettings={setUnsavedLLMSettings}
      />
    </>
  );
});

PipelineEditTab.displayName = 'PipelineEditTab';

/** @type {MuiSx} */
const pipelineEditTabStyles = () => ({
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
});

export default PipelineEditTab;
