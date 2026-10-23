import { memo } from 'react';

import { Box, useTheme } from '@mui/material';

import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

const NodeIconTile = memo(props => {
  const { type, children, size = 'medium', sx = {} } = props;
  const theme = useTheme();

  const styles = nodeIconTileStyles(size);

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid="pipeline-node-icon-tile"
    >
      {children ?? NodeHelpers.getNodeIconByType(type, theme, theme.palette.icon.secondary)}
    </Box>
  );
});

NodeIconTile.displayName = 'NodeIconTile';

/** @type {MuiSx} */
const nodeIconTileStyles = size => ({
  root: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    width: size === 'small' ? '1.5rem' : '2rem',
    height: size === 'small' ? '1.5rem' : '2rem',
    borderRadius: size === 'small' ? '0.375rem' : '0.5rem',
    boxSizing: 'border-box',
    color: palette.icon.secondary,
    backgroundColor: palette.components.flowEditor.card.iconTile.background,
  }),
});

export default NodeIconTile;
