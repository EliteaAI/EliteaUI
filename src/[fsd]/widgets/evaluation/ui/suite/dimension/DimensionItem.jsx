import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import CheckIcon from '@/components/Icons/CheckIcon';

import { getEngineLabel, getTargetLabel, getWeightLabel } from '../../../lib/helpers';

const DimensionItem = memo(props => {
  const { dimension, isSelected, onClick } = props;

  const engines = dimension.allowed_engines ?? [];
  const targetLabel = getTargetLabel(dimension.default_target, dimension.default_target_operator);
  const weightLabel = getWeightLabel(dimension.default_weight);
  const description = dimension.description || '[No Description]';

  const styles = dimensionItemStyles();

  return (
    <Box
      sx={styles.root(isSelected)}
      onClick={onClick}
      data-testid={`select-dimension-${dimension.id}`}
    >
      <Box sx={styles.content}>
        <Box sx={styles.header}>
          <Typography
            variant="bodyMedium"
            sx={styles.name}
          >
            {dimension.name}
          </Typography>
          <Box sx={styles.badges}>
            {engines.map(engine => (
              <Typography
                key={engine}
                component="span"
                variant="bodySmall"
                sx={styles.badge}
              >
                {getEngineLabel(engine)}
              </Typography>
            ))}
            {targetLabel && (
              <Typography
                component="span"
                variant="bodySmall"
                sx={styles.badge}
              >
                {targetLabel}
              </Typography>
            )}
            {weightLabel && (
              <Typography
                component="span"
                variant="bodySmall"
                sx={styles.badge}
              >
                {weightLabel}
              </Typography>
            )}
          </Box>
        </Box>
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          {description}
        </Typography>
      </Box>
      {isSelected && <CheckIcon sx={styles.checkIcon} />}
    </Box>
  );
});

DimensionItem.displayName = 'DimensionItem';

/** @type {MuiSx} */
const dimensionItemStyles = () => ({
  root:
    isSelected =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      height: '5.25rem',
      padding: '0.5rem 1.5rem',
      cursor: 'pointer',
      backgroundColor: isSelected ? palette.background.conversation.selected : 'transparent',
      borderBottom: `0.0625rem solid ${palette.border.lines}`,
      '&:last-child': {
        borderBottom: 'none',
      },
      '&:hover': {
        backgroundColor: isSelected
          ? palette.background.conversation.selected
          : palette.background.conversation.hover,
      },
    }),
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
    flex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  name: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 1,
    minWidth: 0,
  }),
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    flexShrink: 0,
  },
  badge: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    color: palette.text.primary,
    backgroundColor: 'transparent',
    border: `0.0625rem solid ${palette.background.tabButton.default}`,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
  }),
  description: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }),
  checkIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    flexShrink: 0,
    marginLeft: '0.75rem',
    marginTop: '0.125rem',
    color: palette.text.secondary,
    '& path': {
      fill: palette.text.secondary,
    },
  }),
});

export default DimensionItem;
