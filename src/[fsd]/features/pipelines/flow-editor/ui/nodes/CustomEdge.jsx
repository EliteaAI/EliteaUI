import React, { memo, useEffect } from 'react';

import { Typography } from '@mui/material';

import { useTheme } from '@emotion/react';
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

  return (
    <>
      {/* Background stroke for fallback path */}
      <BaseEdge
        id={`${id}-bg`}
        path={fallbackPath}
        style={{
          stroke: theme.palette.background.paper,
          strokeWidth: selected ? 8 : 6, // Thicker background for selected
          fill: 'none',
          opacity: selected ? 0.9 : 0.8,
          zIndex: selected ? 999 : 1,
        }}
      />
      {/* Main fallback edge */}
      <BaseEdge
        id={id}
        path={fallbackPath}
        style={{
          stroke: !selected ? theme.palette.border.flowNode : theme.palette.primary.main,
          strokeWidth: selected ? 3 : 2, // Thicker when selected
          fill: 'none',
          filter: selected ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' : 'none',
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <Typography
            component={'div'}
            sx={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${fallbackLabelX}px,${fallbackLabelY}px)`,
              background: theme.palette.background.tabPanel,
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${!selected ? theme.palette.border.flowNode : theme.palette.primary.main}`,
              zIndex: selected ? 10 : undefined,
            }}
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

export default CustomEdge;
