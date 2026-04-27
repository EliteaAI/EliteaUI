import React, { memo, useCallback } from 'react';

import { Box, Button, Typography } from '@mui/material';

import UnavailableIcon from '@/assets/icons/unavailable-icon.svg?react';

const PreviewUnavailable = memo(props => {
  const { message, onDownload } = props;
  const styles = previewUnavailableStyles();

  const handleDownload = useCallback(() => {
    onDownload?.();
  }, [onDownload]);

  return (
    <Box sx={styles.previewUnavailableWrapper}>
      <Box sx={styles.contentContainer}>
        <Box
          component={UnavailableIcon}
          sx={styles.icon}
        />
        <Typography
          variant="headingSmall"
          sx={styles.header}
        >
          Preview Not Available
        </Typography>
        <Typography
          variant="bodyMedium"
          sx={styles.message}
        >
          {message}
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          Supported formats: txt, md, json, js, ts, py, java, html, css, xml, yaml, csv, tsv, log, sql,
          dockerfile, makefile, images (jpg, png, gif, webp, etc.), and many more programming and config
          files.
        </Typography>
        {onDownload && (
          <Button
            variant="alita"
            color="secondary"
            sx={styles.downloadButton}
            onClick={handleDownload}
            disableRipple
          >
            Download
          </Button>
        )}
      </Box>
    </Box>
  );
});

PreviewUnavailable.displayName = 'PreviewUnavailable';

/** @type {MuiSx} */
const previewUnavailableStyles = () => ({
  previewUnavailableWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '80vh',
    padding: 3,
    textAlign: 'center',
  },

  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '70%',
  },

  icon: ({ palette }) => ({
    width: '2rem',
    height: '2rem',
    color: palette.text.input.placeholder,
    marginBottom: 2,
  }),

  header: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: 1,
  }),

  message: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: 1,
  }),

  description: ({ palette }) => ({
    color: palette.text.tertiary,
    fontSize: '.725rem',
  }),

  downloadButton: ({ spacing }) => ({
    marginTop: spacing(3),
  }),
});

export default PreviewUnavailable;
