import React, { memo, useCallback, useMemo, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import { ChatParticipantType } from '@/common/constants';
import Markdown from '@/components/Markdown.jsx';
import UserAvatar from '@/components/UserAvatar';
import useHighlightUserMessage from '@/hooks/chat/useHighlightUserMessage';
import useParticipantName from '@/hooks/chat/useParticipantName';

import StyledTooltip from '../../ComponentsLib/Tooltip';
import CopyIcon from '../Icons/CopyIcon';
import CopyMoveIcon from '../Icons/CopyMoveIcon';
import DeleteIcon from '../Icons/DeleteIcon';
import EditIcon from '../Icons/EditIcon';
import CreatedTimeInfo from './CreatedTimeInfo';
import MessageAttachmentList from './MessageAttachmentList';
import {
  RelativeButtonsContainer as ButtonsContainer,
  ChatInputContainer,
  StyledTextField,
  UserMessageContainerWithMargin as UserMessageContainer,
} from './StyledComponents';

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
  } = props;
  const [value, setValue] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
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
    setIsEditing(true);
  }, []);

  const onCancel = useCallback(() => {
    setIsEditing(false);
    setValue(content);
  }, [content]);

  const onChange = useCallback(event => {
    setValue(event.target.value);
  }, []);

  const onClickSubmit = useCallback(() => {
    onSubmit(messageId, value);
    setIsEditing(false);
  }, [messageId, onSubmit, value]);

  const isSentToDummyParticipant =
    sentTo &&
    sentTo.entity_name &&
    sentTo.entity_name !== ChatParticipantType.Dummy &&
    participantName !== 'User No Longer Available';

  return (
    <UserMessageContainer
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
              InputProps={{
                sx: styles.editInputField,
                disableUnderline: true,
                endAdornment: null,
              }}
            />
          </ChatInputContainer>
          <Box sx={styles.editButtonsContainer}>
            <Button
              variant="elitea"
              color="primary"
              sx={styles.submitButton}
              disabled={value === content}
              onClick={onClickSubmit}
            >
              Submit
            </Button>
            <Button
              variant="elitea"
              color="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
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
    marginTop: '0.5rem',
  },
  submitButton: {
    marginRight: '0rem',
  },
};
