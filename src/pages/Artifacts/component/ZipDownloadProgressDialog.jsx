import { memo } from 'react';

import { Box, LinearProgress, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BaseModal } from '@/[fsd]/shared/ui/modal';

const ZipDownloadProgressDialog = memo(props => {
  const { open, progress, bucket, onCancel } = props;
  const styles = zipDownloadProgressDialogStyles();

  const content = (
    <Box sx={styles.container}>
      <Box>
        <Typography
          variant="bodySmall"
          sx={styles.label}
        >
          Downloading files...
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(progress.current / progress.total) * 100}
          sx={styles.progressBar}
        />
      </Box>
      <Typography
        variant="caption"
        color="textSecondary"
      >
        {progress.current} of {progress.total} files
      </Typography>
      {progress.filename && (
        <Typography
          variant="headingSmall"
          color="textSecondary"
          sx={styles.filename}
        >
          Current: {progress.filename}
        </Typography>
      )}
    </Box>
  );

  const actions = (
    <Button.BaseBtn
      variant="elitea"
      color="alarm"
      onClick={onCancel}
    >
      Cancel
    </Button.BaseBtn>
  );

  return (
    <BaseModal
      open={open}
      data-testid="artifacts-zip-download-progress-dialog"
      title={`Preparing ${bucket || 'artifacts'}.zip`}
      content={content}
      actions={actions}
      onClose={onCancel}
    />
  );
});

ZipDownloadProgressDialog.displayName = 'ZipDownloadProgressDialog';

/** @type {MuiSx} */
const zipDownloadProgressDialogStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  label: {
    mb: '0.5rem',
  },
  progressBar: {
    height: '0.5rem',
    borderRadius: '0.25rem',
  },
  filename: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default ZipDownloadProgressDialog;
