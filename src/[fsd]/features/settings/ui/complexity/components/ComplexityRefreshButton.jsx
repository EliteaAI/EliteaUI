import { memo, useCallback, useState } from 'react';

import { Alert, Box, CircularProgress, Snackbar, Tooltip } from '@mui/material';

import { BUTTON_VARIANTS, BaseBtn } from '@/[fsd]/shared/ui/button';
import RefreshIcon from '@/assets/refresh-icon.svg?react';

// Keeps the loaded data on failure and reports it in a snackbar instead
const ComplexityRefreshButton = memo(props => {
  const { refetch, disabled = false, testId = 'complexity-refresh-button' } = props;

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshError(false);
    try {
      const result = await refetch();
      if (result?.error) setRefreshError(true);
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refreshing]);

  const handleCloseError = useCallback(() => setRefreshError(false), []);

  return (
    <>
      <Tooltip
        title="Refresh data"
        placement="top"
      >
        <Box component="span">
          <BaseBtn
            variant={BUTTON_VARIANTS.icon}
            color="secondary"
            onClick={handleRefresh}
            disabled={refreshing || disabled}
            aria-label="Refresh data"
            data-testid={testId}
          >
            {refreshing ? (
              <CircularProgress size="1rem" />
            ) : (
              <RefreshIcon
                width="1rem"
                height="1rem"
              />
            )}
          </BaseBtn>
        </Box>
      </Tooltip>
      <Snackbar
        open={refreshError}
        autoHideDuration={8000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          variant="filled"
        >
          Unable to refresh complexity data. Please try again.
        </Alert>
      </Snackbar>
    </>
  );
});

ComplexityRefreshButton.displayName = 'ComplexityRefreshButton';

export default ComplexityRefreshButton;
