import React, { memo, useEffect } from 'react';

import { Typography, useTheme } from '@mui/material';

import { BaseEdge, EdgeLabelRenderer, getBezierPath, useNodes } from '@xyflow/react';

const CustomEdge = memo(props => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const theme = useTheme();
  const nodes = useNodes();

  useEffect(() => {
    // Find the edge element and its nearest SVG ancestor to set z-index
    const edgeElement = document.querySelector(`[data-id="${id}"]`);
    if (edgeElement) {
      const svgAncestor = edgeElement.closest('svg');
      if (svgAncestor) {
        if (selected) {
          svgAncestor.style.zIndex = '1';
        } else {
          svgAncestor.style.zIndex = '0';
        }
      }
    }
  }, [id, selected]);

  const [fallbackPath, fallbackLabelX, fallbackLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
    offset: 100,
    nodes,
  });

  const styles = customEdgeStyles(theme, selected);

  return (
    <>
      {/* Background stroke for fallback path */}
      <BaseEdge
        id={`${id}-bg`}
        path={fallbackPath}
        style={styles.backgroundEdge}
      />
      {/* Main fallback edge */}
      <BaseEdge
        id={id}
        path={fallbackPath}
        style={styles.mainEdge}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <Typography
            component={'div'}
            data-testid={`pipeline-edge-label-${id}`}
            sx={styles.label(fallbackLabelX, fallbackLabelY)}
            variant="bodyMedium"
            color="text.secondary"
          >
            {data.label}
          </Typography>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

/** @type {MuiSx} */
const customEdgeStyles = (theme, selected) => ({
  // BaseEdge renders an SVG path and only accepts `style`.
  backgroundEdge: {
    stroke: theme.palette.background.paper,
    strokeWidth: selected ? 8 : 6, // Thicker background for selected
    fill: 'none',
    opacity: selected ? 0.9 : 0.8,
    zIndex: selected ? 999 : 1,
  },
  mainEdge: {
    stroke: !selected ? theme.palette.components.flowEditor.edge.stroke : theme.palette.primary.main,
    strokeWidth: selected ? 3 : 2, // Thicker when selected
    fill: 'none',
    filter: selected
      ? `drop-shadow(0 0.125rem 0.25rem ${theme.palette.components.flowEditor.edge.shadow})`
      : 'none',
  },
  // Label coordinates come from react-flow in canvas pixels.
  label: (x, y) => ({
    position: 'absolute',
    transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
    background: theme.palette.background.default.tertiary,
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${!selected ? theme.palette.components.flowEditor.node.border : theme.palette.primary.main}`,
    zIndex: selected ? 10 : undefined,
  }),
});

export default CustomEdge;
