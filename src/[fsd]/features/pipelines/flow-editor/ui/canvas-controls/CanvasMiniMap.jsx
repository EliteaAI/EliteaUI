import { memo, useCallback } from 'react';

import { alpha, useTheme } from '@mui/material';

import { MiniMap } from '@xyflow/react';

const MINIMAP_SIZE = { width: 200, height: 140 };

const CanvasMiniMap = memo(props => {
  const { rightOffset = 0 } = props;
  const { palette } = useTheme();
  const { card, panel, minimap } = palette.components.flowEditor;

  // Filled shapes in a contrasting tone: at minimap scale a card-coloured fill or a thin outline disappears
  const getNodeColor = useCallback(
    node => (node.selected ? minimap.node.selected : minimap.node.default),
    [minimap.node.default, minimap.node.selected],
  );

  const styles = canvasMiniMapStyles(rightOffset);

  return (
    <MiniMap
      pannable
      position="bottom-right"
      nodeColor={getNodeColor}
      nodeStrokeWidth={0}
      nodeBorderRadius={12}
      bgColor={panel.background}
      maskColor={alpha(palette.background.default.secondary, 0.6)}
      maskStrokeColor={card.border.selected}
      maskStrokeWidth={2}
      ariaLabel="Pipeline minimap"
      style={styles.root(panel.border)}
      data-testid="pipeline-canvas-minimap"
    />
  );
});

CanvasMiniMap.displayName = 'CanvasMiniMap';

// React Flow's MiniMap takes a plain style object, not sx
const canvasMiniMapStyles = rightOffset => ({
  root: borderColor => ({
    ...MINIMAP_SIZE,
    right: `${rightOffset / 16}rem`,
    border: `0.0625rem solid ${borderColor}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
    transition: 'right 0.2s ease',
  }),
});

export default CanvasMiniMap;
