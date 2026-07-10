import React, { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useParticipantName } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatButton } from '@/[fsd]/features/chat/ui';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import Markdown from '@/[fsd]/shared/ui/markdown';
import { ChatParticipantType } from '@/common/constants';
import CreatedTimeInfo from '@/components/Chat/CreatedTimeInfo';
import MessageAttachmentList from '@/components/Chat/MessageAttachmentList';
import {
  RelativeButtonsContainer as ButtonsContainer,
  ChatInputContainer,
  StyledTextField,
  UserMessageContainerWithMargin as UserMessageContainer,
} from '@/components/Chat/StyledComponents';
import CopyIcon from '@/components/Icons/CopyIcon';
import CopyMoveIcon from '@/components/Icons/CopyMoveIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import UserAvatar from '@/components/UserAvatar';
import useHighlightUserMessage from '@/hooks/chat/useHighlightUserMessage';

const UserMessage = React.forwardRef((props, ref) => {
  const {
    avatar,
    name,
    content,
    message_items,
    created_at,
    onCopy,
    onCopyToMessages,
    onDelete,
    verticalMode,
    onSubmit,
    shouldDisableEdit,
    messageId,
    sentTo,
    onClickSentTo,
    markdown = false,
    onRemoveAttachment,
    onAddEditAttachment,
  } = props;
  const [value, setValue] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [editAttachments, setEditAttachments] = useState([]);
  const { highLightMe } = useHighlightUserMessage(messageId);
  const participantName = useParticipantName(sentTo);
  const questionItem = useMemo(
    () => message_items?.find(item => item.item_type === 'text_message'),
    [message_items],
  );
  const attachmentItems = useMemo(
    () => message_items?.filter(item => item.item_type === 'attachment_message'),
    [message_items],
  );

  const onEdit = useCallback(() => {
    setValue(content || questionItem?.item_details?.content || '');
    setEditAttachments([]);
    setIsEditing(true);
  }, [content, questionItem]);

  const onCancel = useCallback(() => {
    setIsEditing(false);
    setValue(content || questionItem?.item_details?.content || '');
    setEditAttachments([]);
  }, [content, questionItem]);

  const onChange = useCallback(event => {
    setValue(event.target.value);
  }, []);

  const onHandleAddFiles = useCallback(
    async files => {
      if (!onAddEditAttachment) return;
      const uploaded = await onAddEditAttachment(files);
      if (uploaded?.length) {
        setEditAttachments(prev => [...prev, ...uploaded]);
      }
    },
    [onAddEditAttachment],
  );

  const onClickSubmit = useCallback(() => {
    const updatedItems = questionItem
      ? [{ uuid: questionItem.uuid, content: value, item_type: 'text_message' }]
      : [];
    setIsEditing(false);
    setEditAttachments([]);
    onSubmit(messageId, updatedItems, editAttachments);
  }, [editAttachments, messageId, onSubmit, questionItem, value]);

  const isSentToDummyParticipant =
    sentTo &&
    sentTo.entity_name &&
    sentTo.entity_name !== ChatParticipantType.Dummy &&
    participantName !== 'User No Longer Available';

  return (
    <UserMessageContainer
      data-testid="chat-message-item"
      sx={verticalMode ? styles.containerVertical : styles.containerHorizontal}
      ref={ref}
    >
      {verticalMode ? (
        <Box sx={styles.headerBox}>
          <ListItemAvatar sx={styles.avatarContainer}>
            <UserAvatar
              name={name}
              avatar={avatar}
              size={24}
            />
            <Typography
              variant="bodySmall"
              color={'text.secondary'}
              sx={styles.userName}
            >
              {name}
            </Typography>
            {sentTo && sentTo.entity_name && (
              <>
                <Typography variant="bodySmall">to</Typography>
                <StyledTooltip
                  title={isSentToDummyParticipant ? 'Chat now' : ''}
                  placement="top"
                >
                  <Typography
                    onClick={isSentToDummyParticipant ? onClickSentTo : undefined}
                    variant="bodySmall"
                    sx={styles.sentToName(isSentToDummyParticipant)}
                  >
                    {participantName}
                  </Typography>
                </StyledTooltip>
              </>
            )}
          </ListItemAvatar>
          <CreatedTimeInfo created_at={created_at} />
        </Box>
      ) : (
        <ListItemAvatar sx={styles.avatarMinimal}>
          <UserAvatar
            name={name}
            avatar={avatar}
            size={24}
          />
        </ListItemAvatar>
      )}
      {!isEditing ? (
        <Box sx={[styles.messageBase, verticalMode && styles.messageVertical(highLightMe)]}>
          {markdown ? (
            <Markdown>{content}</Markdown>
          ) : (
            (content || questionItem?.item_details?.content || '').split('\n').map((string, index) => (
              <Box key={index}>
                <Typography
                  sx={styles.textContent}
                  variant="bodyMedium"
                >
                  {string}
                </Typography>
              </Box>
            ))
          )}
          <MessageAttachmentList
            items={attachmentItems}
            onRemoveAttachment={onRemoveAttachment}
          />
          <ButtonsContainer
            className={'actionButtons'}
            sx={verticalMode ? styles.buttonsContainerVertical(highLightMe) : undefined}
          >
            {onCopy && (
              <StyledTooltip
                title={'Copy to clipboard'}
                placement="top"
              >
                <IconButton
                  sx={styles.iconButton}
                  variant="elitea"
                  color="tertiary"
                  onClick={onCopy}
                >
                  <CopyIcon sx={styles.icon} />
                </IconButton>
              </StyledTooltip>
            )}
            {onCopyToMessages && (
              <StyledTooltip
                title={'Copy to Messages'}
                placement="top"
              >
                <IconButton
                  sx={styles.iconButton}
                  variant="elitea"
                  color="tertiary"
                  onClick={onCopyToMessages}
                >
                  <CopyMoveIcon sx={styles.icon} />
                </IconButton>
              </StyledTooltip>
            )}
            {verticalMode && onSubmit && (
              <StyledTooltip
                title={'Edit the message and regenerate answer'}
                placement="top"
              >
                <IconButton
                  sx={styles.iconButton}
                  variant="elitea"
                  color="tertiary"
                  disabled={shouldDisableEdit}
                  onClick={onEdit}
                >
                  <EditIcon sx={styles.icon} />
                </IconButton>
              </StyledTooltip>
            )}
            {onDelete && (
              <StyledTooltip
                title={'Delete'}
                placement="top"
              >
                <IconButton
                  sx={styles.iconButton}
                  variant="elitea"
                  color="tertiary"
                  onClick={onDelete}
                >
                  <DeleteIcon sx={styles.icon} />
                </IconButton>
              </StyledTooltip>
            )}
          </ButtonsContainer>
        </Box>
      ) : (
        <Box sx={styles.editContainer}>
          <ChatInputContainer sx={styles.editInputContainer}>
            {onAddEditAttachment && (
              <ChatButton.AttachmentButton
                attachments={editAttachments}
                onAttachFiles={onHandleAddFiles}
              />
            )}
            <StyledTextField
              value={value}
              fullWidth
              id="standard-multiline-static"
              label=""
              multiline
              maxRows={15}
              variant="standard"
              onChange={onChange}
              placeholder=""
              slotProps={{
                input: {
                  sx: styles.editInputField,
                  disableUnderline: true,
                  endAdornment: null,
                },
              }}
            />
          </ChatInputContainer>
          {attachmentItems?.length > 0 && (
            <MessageAttachmentList
              items={attachmentItems}
              onRemoveAttachment={onRemoveAttachment}
            />
          )}
          <Box sx={styles.editButtonsContainer}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.contained}
              color={BUTTON_COLORS.primary}
              sx={styles.submitButton}
              disabled={!editAttachments.length && (value === content || !value.trim())}
              onClick={onClickSubmit}
            >
              Save and apply
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              color={BUTTON_COLORS.secondary}
              onClick={onCancel}
            >
              Cancel
            </Button.BaseBtn>
          </Box>
        </Box>
      )}
    </UserMessageContainer>
  );
});

UserMessage.displayName = 'UserMessage';

export default memo(UserMessage);

/** @type {MuiSx} */
const styles = {
  messageBase: ({ palette }) => ({
    flex: '1 0 0',
    color: palette.text.secondary,
    boxShadow: palette.boxShadow.aiAnswer,
  }),
  messageVertical:
    highLightMe =>
    ({ palette }) => ({
      border: highLightMe ? `0.0625rem solid ${palette.border.highlightUserMessage}` : undefined,
      background: highLightMe ? palette.background.highlightUserMessage : palette.background.aiAnswerBkg,
      width: '100%',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem 0.75rem 1rem',
      position: 'relative',
    }),
  containerVertical: {
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 0rem 0.75rem 0rem',
    '&:hover .actionButtons': {
      visibility: 'visible',
    },
  },
  containerHorizontal: {
    '&:hover .actionButtons': {
      visibility: 'visible',
    },
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0rem 0.25rem 0rem 0.25rem',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  avatarContainer: {
    minWidth: '1.5rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
  },
  avatarMinimal: {
    minWidth: '1.5rem',
  },
  userName: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sentToName: isSentToDummyParticipant => ({
    textDecoration: isSentToDummyParticipant ? 'underline' : 'none',
    cursor: isSentToDummyParticipant ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexShrink: 1,
  }),
  textContent: {
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
  },
  buttonsContainerVertical:
    highLightMe =>
    ({ palette }) => ({
      background: highLightMe ? undefined : palette.background.aiAnswerActions,
    }),
  iconButton: {
    marginLeft: '0rem',
  },
  icon: {
    fontSize: '1rem',
  },
  editContainer: {
    width: '100%',
  },
  editInputContainer: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.userMessageEditor}`,
    background: palette.background.userInputBackground,
  }),
  editInputField: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  editButtonsContainer: {
    display: 'flex',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  submitButton: {
    marginRight: '0rem',
  },
};
