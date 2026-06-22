import { memo } from 'react';

import CloseRounded from '@mui/icons-material/CloseRounded';
import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';
import SpeakingModeIcon from '@/assets/voicewave.svg?react';
import { VOICE_FEATURES_ENABLED, VOICE_FEATURES_TEMPORARILY_DISABLED } from '@/common/constants';
import SendIcon from '@/components/Icons/SendIcon';

const SendButton = memo(props => {
  const {
    isSpeakingMode,
    question,
    disabledSend,
    onEnterSpeakingMode,
    onExitSpeakingMode,
    onSend,
    tooltipOfSendButton,
    sendButton,
    styles,
  } = props;

  if (isSpeakingMode) {
    return (
      <Box sx={styles.voiceModePill}>
        <SpeakingModeIcon sx={styles.voiceModeIcon} />
        <Tooltip
          title="Exit voice chat"
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant="icon"
              onClick={onExitSpeakingMode}
              aria-label="exit voice chat"
              sx={styles.voiceModeClose}
            >
              <CloseRounded sx={{ fontSize: '1rem' }} />
            </BaseBtn>
          </Box>
        </Tooltip>
      </Box>
    );
  }

  if (!question && VOICE_FEATURES_ENABLED && !VOICE_FEATURES_TEMPORARILY_DISABLED) {
    return (
      <Tooltip
        title={VOICE_FEATURES_TEMPORARILY_DISABLED ? 'Temporarily disabled by admin' : 'Speaking mode'}
        placement="top"
      >
        <Box component="span">
          <BaseBtn
            variant="icon"
            disabled={disabledSend}
            onClick={onEnterSpeakingMode}
            aria-label="enter speaking mode"
            sx={styles.sendButton(sendButton)}
          >
            <SpeakingModeIcon sx={styles.sendIcon(sendButton)} />
          </BaseBtn>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={tooltipOfSendButton}
      placement="top"
    >
      <Box component="span">
        <BaseBtn
          variant="icon"
          disabled={disabledSend || !question}
          onClick={onSend}
          aria-label="send your question"
          sx={styles.sendButton(sendButton)}
        >
          <SendIcon sx={styles.sendIcon(sendButton)} />
        </BaseBtn>
      </Box>
    </Tooltip>
  );
});

SendButton.displayName = 'SendButton';

export default SendButton;
