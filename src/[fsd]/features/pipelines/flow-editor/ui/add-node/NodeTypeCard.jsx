import { memo, useCallback } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { NodeHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

const NodeTypeCard = memo(props => {
  const { type, onSelect } = props;
  const theme = useTheme();

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

  const iconBackground =
    theme.palette.components?.flowEditor?.nodeTypeIcon?.background?.[type] ??
    NodeHelpers.getNodeColor(type, theme);

  const styles = nodeTypeCardStyles(iconBackground);

  return (
    <Box
      role="button"
      tabIndex={0}
      data-testid={`pipeline-add-node-menu-item-${type}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={styles.root}
    >
      <Box sx={styles.iconTile}>
        {NodeHelpers.getNodeIconByType(type, theme, theme.palette.icon.secondary)}
      </Box>
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
const nodeTypeCardStyles = iconBackground => ({
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
  iconTile: ({ palette }) => ({
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
