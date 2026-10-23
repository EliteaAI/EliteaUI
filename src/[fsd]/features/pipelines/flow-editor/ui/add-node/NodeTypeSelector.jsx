import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Box, Popover, Typography } from '@mui/material';

import { NodeTypeHelpers, NodeTypeSelectorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

import NodeTypeCard from './NodeTypeCard';

const DEFAULT_ANCHOR_ORIGIN = { vertical: 'bottom', horizontal: 'right' };
const DEFAULT_TRANSFORM_ORIGIN = { vertical: 'top', horizontal: 'right' };

const toRem = px => (px === null ? undefined : `${px / 16}rem`);

const NodeTypeSelector = memo(props => {
  const {
    open,
    anchorEl,
    boundaryEl,
    onClose,
    onSelect,
    anchorOrigin = DEFAULT_ANCHOR_ORIGIN,
    transformOrigin = DEFAULT_TRANSFORM_ORIGIN,
  } = props;

  const nodeTypes = useMemo(() => NodeTypeHelpers.getAddableNodeTypes(), []);

  const openLayoutRef = useRef(null);

  // Measured when the selector opens so it fits the canvas it is shown over. While closing,
  // the last open layout is kept so the popover does not jump to full size during its exit transition.
  const layout = useMemo(() => {
    if (!open && openLayoutRef.current) return openLayoutRef.current;

    return NodeTypeSelectorHelpers.getNodeTypeSelectorLayout({
      boundaryRect: open ? boundaryEl?.getBoundingClientRect() : null,
      anchorRect: open ? anchorEl?.getBoundingClientRect() : null,
      isCentered: transformOrigin.vertical === 'center',
    });
  }, [anchorEl, boundaryEl, open, transformOrigin.vertical]);

  useEffect(() => {
    if (open) openLayoutRef.current = layout;
  }, [layout, open]);

  const handleSelect = useCallback(
    type => {
      onSelect?.(type);
      onClose?.();
    },
    [onClose, onSelect],
  );

  const isCentered = transformOrigin.vertical === 'center';
  const styles = nodeTypeSelectorStyles(layout, Math.ceil(nodeTypes.length / layout.columns), isCentered);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{
        paper: {
          sx: styles.paper,
          'data-testid': 'pipeline-node-type-selector',
          'data-columns': layout.columns,
        },
      }}
    >
      <Typography
        variant="headingSmall"
        color="text.secondary"
        sx={styles.title}
      >
        Select node type
      </Typography>
      <Box sx={styles.grid}>
        {nodeTypes.map(type => (
          <NodeTypeCard
            key={type}
            type={type}
            onSelect={handleSelect}
          />
        ))}
      </Box>
    </Popover>
  );
});

NodeTypeSelector.displayName = 'NodeTypeSelector';

/** @type {MuiSx} */
const nodeTypeSelectorStyles = (layout, rowsCount, isCentered) => ({
  paper: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    marginTop: isCentered ? 0 : '0.5rem',
    padding: '1rem 1rem 1.25rem',
    boxSizing: 'border-box',
    maxWidth: toRem(layout.maxWidth),
    maxHeight: toRem(layout.maxHeight),
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    boxShadow: palette.boxShadow.dialog,
  }),
  title: {
    display: 'block',
    flexShrink: 0,
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 16.125rem))`,
    gridTemplateRows: `repeat(${rowsCount}, auto)`,
    gridAutoFlow: 'column',
    gap: '0.5rem',
    minHeight: 0,
    overflowY: 'auto',
  },
});

export default NodeTypeSelector;
