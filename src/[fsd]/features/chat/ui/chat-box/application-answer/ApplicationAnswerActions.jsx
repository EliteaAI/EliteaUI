import { memo } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { MessageCopyConstants } from '@/[fsd]/shared/lib/constants';
import { useGetComponentWidth } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import CopyIcon from '@/assets/copy.svg?react';
import CopyMdIcon from '@/assets/copymd.svg?react';
import DeleteIcon from '@/assets/delete.svg?react';
import MicphoneIcon from '@/assets/megaphone.svg?react';
import RegenerateIcon from '@/assets/refresh-icon.svg?react';
import { VOICE_FEATURES_ENABLED, VOICE_FEATURES_TEMPORARILY_DISABLED } from '@/common/constants.js';
import { ButtonsContainer } from '@/components/Chat/StyledComponents';
import CopyMoveIcon from '@/components/Icons/CopyMoveIcon';
import EditIcon from '@/components/Icons/EditIcon';

import { ALLOW_EDIT_WHOLE_MESSAGE } from './ApplicationAnswer';

const COMPACT_VIEW_BREAKPOINT = 340;

const { COPY_FORMATS, COPY_LABELS } = MessageCopyConstants;

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
    onClickCopyMarkdown,
    onClickCopyText,
    onCopyToMessages,
    onRegenerate,
    onEdit,
    onClickEdit,
    onDelete,
    onAutoSpeak,
  } = props;

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
              <Button.BaseBtn
                data-testid="chat-read-out-button"
                aria-label="Read out"
                disabled={
                  VOICE_FEATURES_TEMPORARILY_DISABLED || isProcessing || !realAnswer || !!speakingMessageId
                }
                sx={styles.iconButton}
                variant="tertiary"
                onClick={() => onAutoSpeak(realAnswer, messageId)}
              >
                <Box
                  component={MicphoneIcon}
                  sx={styles.icon}
                />
              </Button.BaseBtn>
            </Box>
          </StyledTooltip>
        )}
        {onCopy && (!!answer || !!message_items?.length || !!exception) && (
          <>
            <StyledTooltip
              title={COPY_LABELS[COPY_FORMATS.markdown]}
              placement="top"
            >
              <Box component="span">
                <Button.BaseBtn
                  data-testid="chat-copy-markdown-button"
                  aria-label={COPY_LABELS[COPY_FORMATS.markdown]}
                  disabled={isProcessing || !realAnswer}
                  sx={styles.iconButton}
                  variant="elitea"
                  color="tertiary"
                  onClick={onClickCopyMarkdown}
                >
                  <Box
                    component={CopyMdIcon}
                    sx={styles.icon}
                  />
                </Button.BaseBtn>
              </Box>
            </StyledTooltip>
            <StyledTooltip
              title={COPY_LABELS[COPY_FORMATS.text]}
              placement="top"
            >
              <Box component="span">
                <Button.BaseBtn
                  data-testid="chat-copy-text-button"
                  aria-label={COPY_LABELS[COPY_FORMATS.text]}
                  disabled={isProcessing || !realAnswer}
                  sx={styles.iconButton}
                  variant="elitea"
                  color="tertiary"
                  onClick={onClickCopyText}
                >
                  <Box
                    component={CopyIcon}
                    sx={styles.icon}
                  />
                </Button.BaseBtn>
              </Box>
            </StyledTooltip>
          </>
        )}
        {onCopyToMessages && !!answer && !isApplicationParticipant && (
          <StyledTooltip
            title="Copy to Messages"
            placement="top"
          >
            <Button.BaseBtn
              disabled={isProcessing}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onCopyToMessages}
            >
              <CopyMoveIcon sx={styles.icon} />
            </Button.BaseBtn>
          </StyledTooltip>
        )}
        {onRegenerate && !visibleHitlInterrupts.length && (
          <StyledTooltip
            title="Regenerate"
            placement="top"
          >
            <Box>
              <Button.BaseBtn
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
                <Box
                  component={RegenerateIcon}
                  sx={styles.icon}
                />
              </Button.BaseBtn>
            </Box>
          </StyledTooltip>
        )}
        {onEdit && (!!answer || !!message_items?.length) && ALLOW_EDIT_WHOLE_MESSAGE && (
          <StyledTooltip
            title="Edit response"
            placement="top"
          >
            <Button.BaseBtn
              disabled={isProcessing}
              sx={styles.iconButton}
              variant="elitea"
              color="tertiary"
              onClick={onClickEdit}
            >
              <EditIcon sx={styles.icon} />
            </Button.BaseBtn>
          </StyledTooltip>
        )}
        {onDelete && !visibleHitlInterrupts.length && (
          <StyledTooltip
            title="Delete"
            placement="top"
          >
            <Box>
              <Button.BaseBtn
                data-testid="chat-delete-button"
                disabled={hasCanvasBeingEdited || (isApplicationParticipant ? false : isProcessing)}
                sx={styles.iconButton}
                variant="elitea"
                color="tertiary"
                onClick={onDelete}
              >
                <Box
                  component={DeleteIcon}
                  sx={styles.icon}
                />
              </Button.BaseBtn>
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
  icon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    'button:disabled &': {
      color: palette.icon.disabled,
    },
  }),
});

export default ApplicationAnswerActions;
