import { memo, useCallback } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { ButtonsContainer } from '@/components/Chat/StyledComponents';
import CopyIcon from '@/components/Icons/CopyIcon';
import EliteAIcon from '@/components/Icons/EliteAIcon';
import UserIcon from '@/components/Icons/UserIcon';
import Markdown from '@/components/Markdown';
import useToast from '@/hooks/useToast';

const ModalMessage = memo(props => {
  const { title, isUserMessage, message, renderInMarkdown = true } = props;
  const { toastError, toastInfo } = useToast();
  const styles = modalMessageStyles();

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      toastInfo('The content has been copied to the clipboard');
    } catch {
      toastError('Failed to copy the content!');
      return;
    }
  }, [toastError, toastInfo, message]);

  return (
    <Box sx={styles.messageContainer}>
      <Box sx={styles.messageHeader}>
        {isUserMessage ? (
          <Box sx={styles.userIconContainer}>
            <UserIcon sx={styles.userIcon} />
          </Box>
        ) : (
          <EliteAIcon sx={styles.eliteaIcon} />
        )}
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.messageTitle}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={styles.messageContent}>
        <ButtonsContainer
          className="actionButtons"
          sx={styles.actionButtonsContainer}
        >
          <StyledTooltip
            title="Copy to clipboard"
            placement="top"
          >
            <IconButton
              sx={styles.copyButton}
              variant="icon"
              color="tertiary"
              onClick={onCopy}
            >
              <CopyIcon sx={styles.copyIcon} />
            </IconButton>
          </StyledTooltip>
        </ButtonsContainer>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={renderInMarkdown ? undefined : styles.preserveWhitespace}
        >
          {renderInMarkdown ? <Markdown>{message}</Markdown> : message}
        </Typography>
      </Box>
    </Box>
  );
});

ModalMessage.displayName = 'ModalMessage';

/** @type {MuiSx} */
const modalMessageStyles = () => ({
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },

  messageHeader: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    position: 'relative',
  },

  userIconContainer: ({ palette }) => ({
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '0.75rem',
    background: palette.background.aiParticipantIcon,
    color: palette.icon.fill.inactive,
  }),

  userIcon: ({ palette }) => ({
    fontSize: '1rem',
    fill: palette.icon.fill.inactive,
  }),

  eliteaIcon: {
    fontSize: '1.5rem',
  },

  messageTitle: {
    textTransform: 'capitalize',
  },

  messageContent: ({ palette }) => ({
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    position: 'relative',
    background: palette.background.aiAnswerBkg,
    '&:hover .actionButtons': {
      visibility: 'visible',
    },
  }),

  actionButtonsContainer: {
    visibility: 'hidden',
  },

  copyButton: {
    marginLeft: '0rem',
  },

  copyIcon: {
    fontSize: '1rem',
  },

  preserveWhitespace: {
    whiteSpaceCollapse: 'preserve',
  },
});

export default ModalMessage;
