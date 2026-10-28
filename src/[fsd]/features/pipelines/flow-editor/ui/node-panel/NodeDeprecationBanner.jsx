import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { DeprecatedConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { Banner, Text } from '@/[fsd]/shared/ui';

const READ_ONLY_HINT = 'These fields are read-only. Edit this node in the YAML view.';

const NodeDeprecationBanner = memo(props => {
  const { type } = props;
  const tip = DeprecatedConstants.DeprecatedTips[type];

  if (!tip) return null;

  const styles = nodeDeprecationBannerStyles();

  return (
    <Box data-testid="pipeline-node-panel-deprecation-banner">
      <Banner.BannerMessage containerSx={styles.container}>
        <Box sx={styles.text}>
          <Typography
            variant="labelSmall"
            component="div"
            sx={styles.textColor}
          >
            <Text.TextWithLink {...tip} />
          </Typography>
          <Typography
            variant="bodySmall"
            sx={styles.textColor}
            data-testid="pipeline-node-panel-deprecation-read-only"
          >
            {READ_ONLY_HINT}
          </Typography>
        </Box>
      </Banner.BannerMessage>
    </Box>
  );
});

NodeDeprecationBanner.displayName = 'NodeDeprecationBanner';

/** @type {MuiSx} */
const nodeDeprecationBannerStyles = () => ({
  container: {
    marginTop: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  textColor: ({ palette }) => ({
    color: palette.text.attention,
  }),
});

export default NodeDeprecationBanner;
