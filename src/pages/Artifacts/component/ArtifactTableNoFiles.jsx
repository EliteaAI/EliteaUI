import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import UnavailableIcon from '@/assets/icons/unavailable-icon.svg?react';

const ArtifactTableNoFiles = memo(props => {
  const { message = 'No files', onUpload } = props;
  const styles = artifactTableNoFilesStyles();

  const handleUpload = useCallback(() => {
    onUpload?.();
  }, [onUpload]);

  return (
    <Box sx={styles.noFilesWrapper}>
      <Box sx={styles.contentContainer}>
        <Box
          component={UnavailableIcon}
          sx={styles.icon}
        />
        <Typography
          variant="bodyMedium"
          sx={styles.message}
        >
          {message}
        </Typography>
        {onUpload && (
          <Button.BaseBtn
            variant="elitea"
            color="secondary"
            sx={styles.downloadButton}
            onClick={handleUpload}
          >
            Upload files
          </Button.BaseBtn>
        )}
      </Box>
    </Box>
  );
});

ArtifactTableNoFiles.displayName = 'ArtifactTableNoFiles';

/** @type {MuiSx} */
const artifactTableNoFilesStyles = () => ({
  noFilesWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '3rem',
    textAlign: 'center',
  },

  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },

  icon: ({ palette }) => ({
    width: '2rem',
    height: '2rem',
    color: palette.text.input.placeholder,
  }),

  message: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default ArtifactTableNoFiles;
