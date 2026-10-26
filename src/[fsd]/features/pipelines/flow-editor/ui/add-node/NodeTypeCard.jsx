import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import NodeTypeIconTile from './NodeTypeIconTile';

const NodeTypeCard = memo(props => {
  const { type, onSelect } = props;

  const handleClick = useCallback(() => {
    onSelect?.(type);
  }, [onSelect, type]);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect?.(type);
      }
    },
    [onSelect, type],
  );

  const styles = nodeTypeCardStyles();

  return (
    <Box
      role="button"
      tabIndex={0}
      data-testid={`pipeline-add-node-menu-item-${type}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={styles.root}
    >
      <NodeTypeIconTile type={type} />
      <Box sx={styles.textContainer}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          noWrap
        >
          {FlowEditorConstants.PipelineNodeDisplayNames[type]}
        </Typography>
        <Typography
          variant="bodySmall"
          color="text.primary"
          sx={styles.description}
        >
          {FlowEditorConstants.PipelineNodeDescriptions[type]}
        </Typography>
      </Box>
    </Box>
  );
});

NodeTypeCard.displayName = 'NodeTypeCard';

/** @type {MuiSx} */
const nodeTypeCardStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    minHeight: '4.5rem',
    padding: '0.5rem 1rem 0.5rem 0.75rem',
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    cursor: 'pointer',
    backgroundColor: palette.background.surface.interactive.default,
    '&:hover, &:focus-visible': {
      backgroundColor: palette.background.surface.interactive.active,
      outline: 'none',
    },
  }),
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  description: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
});

export default NodeTypeCard;
