import { memo } from 'react';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box } from '@mui/material';

import { DeprecatedConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { Text } from '@/[fsd]/shared/ui';

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
      <Text.TextWithLink {...tip} />
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
  icon: ({ palette }) => ({
    fontSize: '1rem',
    marginTop: '0.125rem',
    color: palette.components.deprecated.text,
  }),
});

export default NodeDeprecationBanner;
