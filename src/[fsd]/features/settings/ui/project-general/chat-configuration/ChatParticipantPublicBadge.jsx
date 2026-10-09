import { memo } from 'react';

import { Typography } from '@mui/material';

const ChatParticipantPublicBadge = memo(props => {
  const { label } = props;

  const styles = chatParticipantPublicBadgeStyles();

  return (
    <Typography
      variant="bodySmall"
      sx={styles.badge}
    >
      {label}
    </Typography>
  );
});

ChatParticipantPublicBadge.displayName = 'ChatParticipantPublicBadge';

/** @type {MuiSx} */
const chatParticipantPublicBadgeStyles = () => ({
  badge: ({ palette }) => ({
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    height: '1.25rem',
    padding: '0.125rem 0.375rem',
    boxSizing: 'border-box',
    borderRadius: '0.875rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.metrics,
  }),
});

export default ChatParticipantPublicBadge;
