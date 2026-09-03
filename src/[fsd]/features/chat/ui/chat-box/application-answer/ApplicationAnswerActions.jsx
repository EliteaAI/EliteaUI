import { memo } from 'react';

import { Box, IconButton, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import MicphoneIcon from '@/assets/megaphone.svg?react';
import { VOICE_FEATURES_ENABLED, VOICE_FEATURES_TEMPORARILY_DISABLED } from '@/common/constants.js';
import { ButtonsContainer } from '@/components/Chat/StyledComponents';
import CopyIcon from '@/components/Icons/CopyIcon';
import CopyMoveIcon from '@/components/Icons/CopyMoveIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import RegenerateIcon from '@/components/Icons/RegenerateIcon';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';

import { ALLOW_EDIT_WHOLE_MESSAGE } from './ApplicationAnswer';

const COMPACT_VIEW_BREAKPOINT = 340;

const ApplicationAnswerActions = memo(props => {
  const {
    answer,
    message_items,
    exception,
    messageId,
    isApplicationParticipant,
    isProcessing,
    realAnswer,
    hasSpeakableText,
    speakingMessageId,
    hasCanvasBeingEdited,
    shouldDisableRegenerate,
    visibleHitlInterrupts,
    onCopy,
    onClickCopy,
    onCopyToMessages,
    onRegenerate,
    onEdit,
    onClickEdit,
    onDelete,
    onAutoSpeak,
  } = props;

  const theme = useTheme();
  const { componentRef, componentWidth } = useGetComponentWidth();
  const isWideView = componentWidth > COMPACT_VIEW_BREAKPOINT;

  const styles = applicationAnswerActionsStyles(isWideView);

  return (
    <Box
      sx={styles.actionButtonsBox}
      ref={componentRef}
    >
      <ButtonsContainer
        className="actionButtons"
        sx={styles.buttonsContainer}
      >
        {onAutoSpeak && hasSpeakableText && VOICE_FEATURES_ENABLED && (
          <StyledTooltip
            title={VOICE_FEATURES_TEMPORARILY_DISABLED ? 'Voice features temporarily disabled' : 'Read out'}
            placement="top"
          >
            <Box component="span">
              <BaseBtn
                data-testid="chat-read-out-button"
                aria-label="Read out"
                disabled={
                  VOICE_FEATURES_TEMPORARILY_DISABLED || isProcessing || !realAnswer || !!speakingMessageId
                }
                sx={styles.iconButton}
                variant="tertiary"
                onClick={() => onAutoSpeak(realAnswer, messageId)}
              >
                <MicphoneIcon sx={styles.icon} />
              </BaseBtn>
            </Box>
          </StyledTooltip>
        )}
        {onCopy && (!!answer || !!message_items?.length || !!exception) && (
          <StyledTooltip
            title="Copy to clipboard"
            placement="top"
          >
            <IconButton
              data-testid="chat-copy-button"
              disabled={isProcessing || !realAnswer}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onClickCopy}
            >
              <CopyIcon sx={styles.icon} />
            </IconButton>
          </StyledTooltip>
        )}
        {onCopyToMessages && !!answer && !isApplicationParticipant && (
          <StyledTooltip
            title="Copy to Messages"
            placement="top"
          >
            <IconButton
              disabled={isProcessing}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onCopyToMessages}
            >
              <CopyMoveIcon sx={styles.icon} />
            </IconButton>
          </StyledTooltip>
        )}
        {onRegenerate && !visibleHitlInterrupts.length && (
          <StyledTooltip
            title="Regenerate"
            placement="top"
          >
            <Box>
              <IconButton
                data-testid="chat-regenerate-button"
                sx={styles.iconButton}
                variant="elitea"
                color="tertiary"
                disabled={
                  shouldDisableRegenerate ||
                  hasCanvasBeingEdited ||
                  (isApplicationParticipant ? false : isProcessing)
                }
                onClick={onRegenerate}
              >
                <RegenerateIcon
                  sx={styles.icon}
                  fill={
                    shouldDisableRegenerate || hasCanvasBeingEdited
                      ? theme.palette.icon.fill.disabled
                      : theme.palette.icon.fill.default
                  }
                />
              </IconButton>
            </Box>
          </StyledTooltip>
        )}
        {onEdit && (!!answer || !!message_items?.length) && ALLOW_EDIT_WHOLE_MESSAGE && (
          <StyledTooltip
            title="Edit response"
            placement="top"
          >
            <IconButton
              disabled={isProcessing}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onClickEdit}
            >
              <EditIcon sx={styles.icon} />
            </IconButton>
          </StyledTooltip>
        )}
        {onDelete && !visibleHitlInterrupts.length && (
          <StyledTooltip
            title="Delete"
            placement="top"
          >
            <Box>
              <IconButton
                data-testid="chat-delete-button"
                disabled={hasCanvasBeingEdited || (isApplicationParticipant ? false : isProcessing)}
                sx={styles.iconButton}
                variant="elitea"
                color="tertiary"
                onClick={onDelete}
              >
                <DeleteIcon
                  sx={styles.icon}
                  fill={
                    hasCanvasBeingEdited ? theme.palette.icon.fill.disabled : theme.palette.icon.fill.default
                  }
                />
              </IconButton>
            </Box>
          </StyledTooltip>
        )}
      </ButtonsContainer>
    </Box>
  );
});

ApplicationAnswerActions.displayName = 'ApplicationAnswerActions';

/** @type {MuiSx} */
const applicationAnswerActionsStyles = isWideView => ({
  actionButtonsBox: {
    display: 'flex',
    justifyContent: 'end',
    alignItems: 'center',
    marginTop: '0.5rem',
    gap: isWideView ? '0' : '0.5rem',
  },
  buttonsContainer: {
    position: 'relative',
    top: '0',
    right: '0',
    paddingBottom: '0',
    paddingLeft: isWideView ? '2rem' : '0',
  },
  iconButton: {
    marginLeft: '0',
    minWidth: '1rem',
    width: '1rem',
    height: '1.75rem',
    padding: '0',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default ApplicationAnswerActions;
