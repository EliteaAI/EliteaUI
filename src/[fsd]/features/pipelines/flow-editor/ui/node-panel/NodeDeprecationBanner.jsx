import { memo } from 'react';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Typography } from '@mui/material';

import { DeprecatedConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { Text } from '@/[fsd]/shared/ui';

const READ_ONLY_HINT = 'These fields are read-only. Edit this node in the Yaml tab.';

const NodeDeprecationBanner = memo(props => {
  const { type } = props;
  const tip = DeprecatedConstants.DeprecatedTips[type];

  if (!tip) return null;

  const styles = nodeDeprecationBannerStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-node-panel-deprecation-banner"
    >
      <WarningAmberIcon sx={styles.icon} />
      <Box sx={styles.text}>
        <Text.TextWithLink {...tip} />
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="pipeline-node-panel-deprecation-read-only"
        >
          {READ_ONLY_HINT}
        </Typography>
      </Box>
    </Box>
  );
});

NodeDeprecationBanner.displayName = 'NodeDeprecationBanner';

/** @type {MuiSx} */
const nodeDeprecationBannerStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.components.deprecated.background,
  }),
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  icon: ({ palette }) => ({
    fontSize: '1rem',
    marginTop: '0.125rem',
    color: palette.components.deprecated.text,
  }),
});

export default NodeDeprecationBanner;
