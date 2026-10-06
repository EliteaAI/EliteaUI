import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { PUBLIC_PROJECT_ID } from '@/common/constants';

import ChatParticipantIcon from './ChatParticipantIcon';

const ChatParticipantOption = memo(props => {
  const { option } = props;

  const styles = chatParticipantOptionStyles();
  const isPublic = option.project_id === PUBLIC_PROJECT_ID;

  return (
    <Box sx={styles.root}>
      <ChatParticipantIcon
        participant={option}
        withBackground
      />
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.name}
      >
        {option.name}
      </Typography>
      {isPublic && (
        <Typography
          variant="bodySmall"
          sx={styles.publicBadge}
        >
          Public
        </Typography>
      )}
    </Box>
  );
});

ChatParticipantOption.displayName = 'ChatParticipantOption';

/** @type {MuiSx} */
const chatParticipantOptionStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  name: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  publicBadge: ({ palette }) => ({
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

export default ChatParticipantOption;
