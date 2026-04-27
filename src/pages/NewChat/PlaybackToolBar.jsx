import { useCallback, useEffect, useRef, useState } from 'react';

import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { Box, IconButton } from '@mui/material';

import FileList from '@/components/Chat/FileList';
import {
  ChatInputContainer,
  SendButtonContainer,
  StyledCircleProgress,
  StyledTextField,
} from '@/components/Chat/StyledComponents';
import { StyledUnfoldLessIcon, StyledUnfoldMoreIcon } from '@/pages/Common/Components/StyledComponents';

const MAX_ROWS = 15;
const MIN_ROWS = 3;
const MIN_HEIGHT = 70;

export default function PlaybackToolBar(props) {
  const {
    sx,
    placeholder = 'Type your message',
    disableBackward,
    disableForward,
    onForward,
    onBackward,
    message,
    isMockingThinking,
  } = props;
  const [showExpandIcon, setShowExpandIcon] = useState(false);
  const [rows, setRows] = useState(MAX_ROWS);
  const textInputRef = useRef();
  const attachments = message?.message_items
    ? message.message_items
        .filter(item => item.item_type === 'attachment_message')
        .map(item => ({ name: item.item_details.name, id: item.item_details.id }))
    : [];
  const onClickExpander = useCallback(() => {
    setRows(prevRows => (prevRows === MAX_ROWS ? MIN_ROWS : MAX_ROWS));
  }, []);

  const onClickForward = useCallback(() => {
    if (!disableForward && !isMockingThinking) {
      onForward();
    }
  }, [disableForward, isMockingThinking, onForward]);

  const onClickBackward = useCallback(() => {
    if (!disableBackward) {
      onBackward();
    }
  }, [disableBackward, onBackward]);

  const onKeyDown = useCallback(
    event => {
      switch (event.keyCode) {
        case 37:
          //Arrow Left
          event.preventDefault();
          onClickBackward();
          break;
        case 39:
          //Arrow Right
          event.preventDefault();
          onClickForward();
          break;
      }
    },
    [onClickBackward, onClickForward],
  );

  useEffect(() => {
    if (textInputRef.current?.offsetHeight > MIN_HEIGHT) {
      setShowExpandIcon(true);
      setRows(MAX_ROWS);
    } else {
      setShowExpandIcon(false);
    }
  }, []);

  useEffect(() => {
    // Add event listener
    window.addEventListener('keydown', onKeyDown);
    // Cleanup: remove event listener
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <ChatInputContainer sx={sx}>
      <SendButtonContainer
        onClick={onClickBackward}
        sx={styles.sendButtonContainer}
      >
        <ArrowLeftIcon
          fontSize="large"
          sx={styles.getArrowLeftColor(disableBackward)}
        />
      </SendButtonContainer>
      <Box sx={styles.contentBox}>
        {attachments?.length > 0 && (
          <FileList
            disabledDelete
            files={attachments}
            onDeleteFile={() => {}}
          />
        )}
        <StyledTextField
          ref={textInputRef}
          focused
          autoFocus
          disabled
          value={(
            message?.content ||
            message?.message_items
              ?.filter(item => item.item_type !== 'attachment_message')
              .map(item => item.item_details.content)
              .join() ||
            ''
          ).trim()}
          fullWidth
          // id="standard-multiline-static"
          label=""
          multiline
          maxRows={rows}
          variant="standard"
          sx={styles.textField}
          placeholder={placeholder}
          InputProps={{
            sx: styles.inputBase,
            disableUnderline: true,
            endAdornment: showExpandIcon ? (
              <IconButton
                size="small"
                variant="alita"
                color="tertiary"
                onClick={onClickExpander}
              >
                {rows === MAX_ROWS ? (
                  <StyledUnfoldLessIcon sx={styles.iconSize} />
                ) : (
                  <StyledUnfoldMoreIcon sx={styles.iconSize} />
                )}
              </IconButton>
            ) : null,
          }}
        />
      </Box>
      <SendButtonContainer
        onClick={onClickForward}
        sx={styles.sendButtonContainer}
      >
        <ArrowRightIcon
          fontSize="large"
          sx={styles.getArrowRightColor(disableForward, isMockingThinking)}
        />
        {isMockingThinking && <StyledCircleProgress />}
      </SendButtonContainer>
    </ChatInputContainer>
  );
}

const styles = {
  sendButtonContainer: {
    width: '30px',
    height: '100%',
    cursor: 'pointer',
  },
  getArrowLeftColor:
    disableBackward =>
    ({ palette }) => ({
      color: disableBackward ? palette.background.button.primary.disabled : 'currentcolor',
    }),
  contentBox: {
    flex: 1,
    marginRight: 1,
    flexDirection: 'column',
    gap: '24px',
  },
  textField: ({ palette }) => ({
    padding: '0px',
    '& textarea': {
      marginBottom: '0px',
    },
    color: palette.text.secondary,
    '& .MuiInputBase-input.Mui-disabled': {
      color: `${palette.text.secondary} !important`,
      WebkitTextFillColor: `${palette.text.secondary}`,
    },
  }),
  inputBase: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  iconSize: {
    fontSize: '16px',
  },
  getArrowRightColor:
    (disableForward, isMockingThinking) =>
    ({ palette }) => ({
      color:
        disableForward || isMockingThinking ? palette.background.button.primary.disabled : 'currentcolor',
    }),
};
