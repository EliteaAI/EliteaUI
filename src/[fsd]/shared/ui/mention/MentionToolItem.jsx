import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const MentionToolItem = memo(props => {
  const { label, description, icon, onClick, isHighlighted } = props;
  const styles = mentionToolItemStyles({ isHighlighted });
  return (
    <Box
      onClick={onClick}
      data-highlighted={isHighlighted ? 'true' : undefined}
      sx={styles.container}
    >
      <Box sx={styles.labelRow}>
        {icon && <Box sx={styles.iconBox}>{icon}</Box>}
        <Typography
          variant="headingSmall"
          color="text.secondary"
          sx={styles.label}
        >
          {label}
        </Typography>
      </Box>
      {description && (
        <Typography
          variant="bodySmall"
          color="text.primary"
          sx={styles.description}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
});

MentionToolItem.displayName = 'MentionToolItem';

export default MentionToolItem;

/** @type {MuiSx} */
const mentionToolItemStyles = ({ isHighlighted } = {}) => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    background: isHighlighted
      ? palette.background.userInputBackgroundActive
      : palette.background.userInputBackground,
    '&:hover': { background: palette.background.userInputBackgroundActive },
  }),
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  description: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1,
  },
});
