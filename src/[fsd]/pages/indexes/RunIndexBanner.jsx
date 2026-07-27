import { memo } from 'react';

import { Alert } from '@mui/material';

import { Button as EliteaButton } from '@/[fsd]/shared/ui';

const RunIndexBanner = memo(props => {
  const { banner, dismissed, onDismiss, isIndexing, isStoppingIndexing, onCancelIndexing } = props;
  const styles = runIndexBannerStyles();

  const canDismiss = banner.severity === 'success' || banner.severity === 'info';

  if (dismissed && canDismiss) return null;

  return (
    <Alert
      severity={banner.severity}
      variant="outlined"
      onClose={canDismiss ? onDismiss : undefined}
      sx={styles.banner}
      action={
        isIndexing ? (
          <EliteaButton.DiscardButton
            title={isStoppingIndexing ? 'Stopping…' : 'Stop'}
            alertContent="Are you sure you want to stop indexing?"
            onDiscard={onCancelIndexing}
            disabled={isStoppingIndexing}
            discarding={isStoppingIndexing}
          />
        ) : null
      }
    >
      {banner.label}
    </Alert>
  );
});

RunIndexBanner.displayName = 'RunIndexBanner';

/** @type {MuiSx} */
const runIndexBannerStyles = () => ({
  banner: {
    alignItems: 'center',
    borderRadius: '0.5rem',
    '& .MuiAlert-message': { flex: 1 },
  },
});

export default RunIndexBanner;
