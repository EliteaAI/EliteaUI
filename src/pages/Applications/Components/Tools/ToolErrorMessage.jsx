import { memo, useCallback, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { BORDER_RADIUS } from '@/common/designTokens';
import AttentionIcon from '@/components/Icons/AttentionIcon';

const ToolErrorMessage = memo(props => {
  const { message } = props;
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <Tooltip
      title={expanded ? '' : message}
      placement="top"
      enterDelay={1000}
    >
      <Box
        sx={styles.container}
        onClick={handleToggle}
      >
        <Box
          component={AttentionIcon}
          sx={styles.icon}
        />
        <Typography
          variant="bodySmall"
          sx={styles.message(expanded)}
        >
          {message}
        </Typography>
      </Box>
    </Tooltip>
  );
});

ToolErrorMessage.displayName = 'ToolErrorMessage';

export default ToolErrorMessage;

/** @type {MuiSx} */
const styles = {
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: palette.background.attention,
    border: `0.0625rem solid ${palette.border.attention}`,
    borderRadius: BORDER_RADIUS.MD,
    marginTop: '0.5rem',
    cursor: 'pointer',
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    fill: palette.icon.fill.attention,
    flexShrink: 0,
  }),
  message:
    expanded =>
    ({ palette }) => ({
      flex: 1,
      color: palette.text.attention,
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: expanded ? undefined : 1,
      wordBreak: 'break-word',
    }),
};
