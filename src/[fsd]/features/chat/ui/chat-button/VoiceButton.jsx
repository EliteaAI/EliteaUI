import { forwardRef, memo, useCallback, useContext, useEffect, useImperativeHandle, useRef } from 'react';

import { Box } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { isWhisperModel } from '@/[fsd]/features/chat/lib/helpers';
import { useSpeechRecognition, useStreamingSpeechRecognition } from '@/[fsd]/features/chat/lib/hooks';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { useListModelsQuery } from '@/api/configurations';
import MicIcon from '@/assets/microphone.svg?react';
import StopIcon from '@/assets/stop_record.svg?react';
import { VOICE_FEATURES_ENABLED, VOICE_FEATURES_TEMPORARILY_DISABLED } from '@/common/constants';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Smart voice input toolbar button.
 *
 * Owns all recording logic: cursor-aware transcript insertion,
 * error handling, and input focus restoration on stop.
 *
 * When a server-side ASR model is configured, uses the OpenAI Realtime API
 * via Socket.IO streaming. Falls back to the Web Speech API when no ASR model
 * is available.
 *
 * Idle state:    [ Mic ]
 * Recording:     [ Mic (teal/active) ][ Stop (■) ]
 *
 * Returns null when neither server ASR nor the Web Speech API is available.
 */
const VoiceButton = memo(
  forwardRef((props, ref) => {
    const { inputRef, disabled, onRecordingChange } = props;
    const { toastError } = useToast();
    const socket = useContext(SocketContext);
    const projectId = useSelectedProjectId();

    // Text before the cursor position at the moment recording started
    const preCursorContentRef = useRef('');
    // Text after the cursor position at the moment recording started
    const postCursorContentRef = useRef('');
    // Accumulates all finalized voice text within the current recording session
    const voiceFinalAccumulatedRef = useRef('');
    // The last value we programmatically set via setValue — used to detect
    // manual edits the user made between transcript events.
    const lastSetValueRef = useRef(null);

    const handleTranscript = useCallback(
      ({ final, interim }) => {
        // If the user manually edited the input between transcript events (e.g. deleted
        // the previous transcript while still recording), re-sync our cursor refs so the
        // next transcript continues from the current input state rather than the stale
        // accumulated refs.
        if (lastSetValueRef.current !== null) {
          const currentContent = inputRef.current?.getInputContent() ?? '';
          if (currentContent !== lastSetValueRef.current) {
            const cursor = inputRef.current?.getCursorPosition() ?? currentContent.length;
            preCursorContentRef.current = currentContent.slice(0, cursor);
            postCursorContentRef.current = currentContent.slice(cursor);
            voiceFinalAccumulatedRef.current = '';
          }
        }

        const voiceBase = preCursorContentRef.current + voiceFinalAccumulatedRef.current;
        if (interim) {
          // Live preview: cursor sits after the interim words (before postCursor)
          const newValue = voiceBase + interim + postCursorContentRef.current;
          const cursorPos = voiceBase.length + interim.length;
          lastSetValueRef.current = newValue;
          inputRef.current?.setValue(newValue, cursorPos);
        }
        if (final) {
          // Commit: accumulate final, place cursor right after the inserted voice text
          voiceFinalAccumulatedRef.current += (voiceFinalAccumulatedRef.current ? ' ' : '') + final;
          const newValue =
            preCursorContentRef.current + voiceFinalAccumulatedRef.current + postCursorContentRef.current;
          const cursorPos = preCursorContentRef.current.length + voiceFinalAccumulatedRef.current.length;
          lastSetValueRef.current = newValue;
          inputRef.current?.setValue(newValue, cursorPos);
        }
      },
      [inputRef],
    );

    const handleVoiceError = useCallback(
      error => {
        const errorMessages = {
          'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
          'audio-capture': 'No microphone found. Please connect a microphone and try again.',
          network: 'Voice input requires an internet connection. Please check your connection and try again.',
        };
        const message = errorMessages[error];
        if (message) toastError(message);
        // 'no-speech' and 'aborted' are silently ignored — not user-facing errors
      },
      [toastError],
    );

    /**
     * Select the best available ASR model following priority order:
     * default streaming → first streaming → default whisper → first whisper
     */
    const selectAsrModel = useCallback(items => {
      const streamingModels = items.filter(m => !isWhisperModel(m.name));
      const whisperModels = items.filter(m => isWhisperModel(m.name));

      return (
        streamingModels.find(m => m.default) ??
        streamingModels[0] ??
        whisperModels.find(m => m.default) ??
        whisperModels[0]
      );
    }, []);

    const { data: asrModelsData } = useListModelsQuery(
      { projectId, section: 'asr', include_shared: true },
      { skip: !projectId },
    );
    const asrModel = selectAsrModel(asrModelsData?.items ?? []);

    const serverHook = useStreamingSpeechRecognition({
      onTranscript: handleTranscript,
      onError: handleVoiceError,
      socket,
      projectId,
      asrModel,
    });

    const clientHook = useSpeechRecognition({
      onTranscript: handleTranscript,
      onError: handleVoiceError,
    });

    // Priority: 1. streaming model, 2. whisper model, 3. browser Speech API, 4. hide button
    const { isRecording, isSupported, startRecording, stopRecording } = serverHook.isSupported
      ? serverHook
      : clientHook;

    useEffect(() => {
      onRecordingChange?.(isRecording);
    }, [isRecording, onRecordingChange]);

    const handleStartRecording = useCallback(() => {
      const content = inputRef.current?.getInputContent() ?? '';
      const cursor = inputRef.current?.getCursorPosition() ?? content.length;
      // Split content at cursor so voice text is inserted at that exact position
      preCursorContentRef.current = content.slice(0, cursor);
      postCursorContentRef.current = content.slice(cursor);
      voiceFinalAccumulatedRef.current = '';
      // Seed the edit-detection tracker with the content as it is now, so the
      // first transcript event can tell if the user edits before it arrives.
      lastSetValueRef.current = content;
      startRecording();
    }, [inputRef, startRecording]);

    const handleStopRecording = useCallback(() => {
      stopRecording();
      inputRef.current?.focus();
    }, [inputRef, stopRecording]);

    useImperativeHandle(ref, () => ({ stop: handleStopRecording }), [handleStopRecording]);

    if (!isSupported) return null;
    if (!VOICE_FEATURES_ENABLED) return null;

    const isAdminDisabled = VOICE_FEATURES_TEMPORARILY_DISABLED;
    const styles = getStyles(isRecording, disabled || isAdminDisabled);

    return (
      <Box
        component="span"
        sx={styles.wrapper}
      >
        <Tooltip
          title={
            isAdminDisabled
              ? 'Temporarily disabled by admin'
              : isRecording
                ? 'Voice input active'
                : 'Start voice input'
          }
          placement="top"
        >
          <Box component="span">
            <BaseBtn
              variant={BUTTON_VARIANTS.icon}
              color={isRecording ? 'tertiary' : 'secondary'}
              onClick={isAdminDisabled || isRecording ? undefined : handleStartRecording}
              aria-label={isRecording ? 'voice input active' : 'start voice input'}
              aria-pressed={isRecording}
              disabled={disabled || isRecording || isAdminDisabled}
              sx={styles.micButton}
            >
              <MicIcon sx={styles.icon} />
            </BaseBtn>
          </Box>
        </Tooltip>

        {isRecording && (
          <Tooltip
            title="Stop dictation"
            placement="top"
          >
            <Box component="span">
              <BaseBtn
                variant={BUTTON_VARIANTS.icon}
                color="secondary"
                aria-label="stop voice input"
                onClick={handleStopRecording}
                disabled={disabled}
                sx={styles.stopButton}
              >
                <StopIcon sx={styles.icon} />
              </BaseBtn>
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }),
);

VoiceButton.displayName = 'VoiceButton';

/** @type {MuiSx} */
const getStyles = (isRecording, disabled) => {
  const micButtonColor = palette =>
    disabled ? palette.icon.fill.disabled : isRecording ? palette.primary.main : palette.text.secondary;
  return {
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: isRecording ? '0.5rem' : '0rem',
      border: isRecording ? theme => `0.0625rem solid ${theme.palette.border.chatContinue}` : 'none',
      padding: '0rem',
      borderRadius: isRecording ? '1.75rem' : '0rem',
      boxSizing: 'border-box',
      height: '1.75rem',
    },
    micButton: ({ palette }) => ({
      marginLeft: '0rem',
      color: `${micButtonColor(palette)} !important`,
      ...(isRecording && { backgroundColor: 'transparent !important' }),
    }),
    stopButton: {
      marginLeft: '0rem',
      color: ({ palette }) => palette.text.secondary,
    },
    icon: {
      fontSize: '1rem',
    },
  };
};

export default VoiceButton;
