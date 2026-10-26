import { memo } from 'react';

import { Box, useTheme } from '@mui/material';

import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

// 28px tile in the node type's colour, as in Select node type and the node panel header
const NodeTypeIconTile = memo(props => {
  const { type, sx = {} } = props;
  const theme = useTheme();

  const iconBackground =
    theme.palette.components?.flowEditor?.nodeTypeIcon?.background?.[type] ??
    NodeHelpers.getNodeColor(type, theme);

  const styles = nodeTypeIconTileStyles(iconBackground);

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid="pipeline-node-type-icon-tile"
    >
      {NodeHelpers.getNodeIconByType(type, theme, theme.palette.icon.secondary)}
    </Box>
  );
});

NodeTypeIconTile.displayName = 'NodeTypeIconTile';

/** @type {MuiSx} */
const nodeTypeIconTileStyles = iconBackground => ({
  root: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    width: '1.75rem',
    height: '1.75rem',
    padding: '0.375rem',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.subtle}`,
    backgroundColor: iconBackground,
  }),
});

export default NodeTypeIconTile;
