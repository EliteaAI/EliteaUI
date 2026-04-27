import { memo } from 'react';

import { Box, Button, LinearProgress, Typography } from '@mui/material';

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
    <Button
      variant="alita"
      color="alarm"
      onClick={onCancel}
      disableRipple
    >
      Cancel
    </Button>
  );

  return (
    <BaseModal
      open={open}
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
