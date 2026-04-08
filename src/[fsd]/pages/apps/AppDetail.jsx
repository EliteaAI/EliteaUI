import { memo, useRef } from 'react';

import { Alert, Box, CircularProgress } from '@mui/material';

import { useAppDetail } from '@/[fsd]/features/apps/lib/hooks';
import { buildErrorMessage } from '@/common/utils.jsx';
import { EditToolkit } from '@/pages/Toolkits/EditToolkit';

/**
 * AppDetail page component for displaying application details
 * If the application provides a custom UI, it renders an iframe
 * Otherwise, it falls back to the standard EditToolkit view
 */
const AppDetail = memo(() => {
  const iframeRef = useRef(null);
  const styles = appDetailStyles();

  const { appName, isFetching, isError, error, iframeUrl, iframeKey, hasCustomUI } = useAppDetail();

  if (isFetching) {
    return (
      <Box sx={styles.loadingContainer}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={styles.errorContainer}>
        <Alert severity="error">{buildErrorMessage(error)}</Alert>
      </Box>
    );
  }

  if (hasCustomUI) {
    return (
      <Box sx={styles.iframeContainer}>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={iframeUrl}
          style={styles.iframe}
          title={`${appName} Custom UI`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </Box>
    );
  }

  return <EditToolkit />;
});

AppDetail.displayName = 'AppDetail';

/** @type {MuiSx} */
const appDetailStyles = () => ({
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '25rem',
  },
  errorContainer: {
    p: '1.5rem',
  },
  iframeContainer: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
  },
});

export default AppDetail;
