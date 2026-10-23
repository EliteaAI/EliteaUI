import { memo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { DeprecatedConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { Text } from '@/[fsd]/shared/ui';

const NodeDeprecatedBadge = memo(props => {
  const { type } = props;
  const styles = nodeDeprecatedBadgeStyles();

  return (
    <Tooltip
      title={<Text.TextWithLink {...DeprecatedConstants.DeprecatedTips[type]} />}
      placement="top"
    >
      <Box
        sx={styles.root}
        data-testid="pipeline-node-deprecated-badge"
      >
        <Typography
          variant="bodySmall"
          sx={styles.text}
          noWrap
        >
          Deprecated!
        </Typography>
      </Box>
    </Tooltip>
  );
});

NodeDeprecatedBadge.displayName = 'NodeDeprecatedBadge';

/** @type {MuiSx} */
const nodeDeprecatedBadgeStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    flex: '0 1 auto',
    minWidth: '3.5rem',
    height: '1.5rem',
    padding: '0 0.5rem',
    boxSizing: 'border-box',
    borderRadius: '1rem',
    cursor: 'pointer',
    backgroundColor: palette.components.deprecated.background,
  }),
  text: ({ palette }) => ({
    color: palette.components.deprecated.text,
  }),
});

export default NodeDeprecatedBadge;
