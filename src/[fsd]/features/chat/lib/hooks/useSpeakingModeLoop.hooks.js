import { useCallback, useContext, useEffect, useRef } from 'react';

import { useListModelsQuery } from '@/api/configurations';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useSpeechRecognition } from './useSpeechRecognition.hooks';
import { useStreamingSpeechRecognition } from './useStreamingSpeechRecognition.hooks';

const SILENCE_TIMEOUT_MS = 3000;

const isWhisperModelName = name => Boolean(name && name.toLowerCase().includes('whisper'));

const selectAsrModel = items => {
  const streaming = items.filter(m => !isWhisperModelName(m.name));
  const whisper = items.filter(m => isWhisperModelName(m.name));
  return streaming.find(m => m.default) ?? streaming[0] ?? whisper.find(m => m.default) ?? whisper[0];
};

/**
 * Voice loop for speaking mode:
 *  1. Auto-starts recording when isSpeakingMode is enabled
 *  2. Inserts transcript into inputRef
 *  3. After SILENCE_TIMEOUT_MS of no new final transcript → auto-sends
 *  4. Waits for AI to finish streaming AND TTS to finish playing
 *  5. Restarts recording for the next turn
 */
export const useSpeakingModeLoop = ({ isSpeakingMode, inputRef, isStreaming, isTTSPlaying }) => {
  const socket = useContext(SocketContext);
  const projectId = useSelectedProjectId();

  const preCursorRef = useRef('');
  const postCursorRef = useRef('');
  const voiceAccumulatedRef = useRef('');
  const silenceTimerRef = useRef(null);
  const hasSentRef = useRef(false);

  const { data: asrModelsData } = useListModelsQuery(
    { projectId, section: 'asr', include_shared: true },
    { skip: !projectId },
  );
  const asrModel = selectAsrModel(asrModelsData?.items ?? []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const handleTranscript = useCallback(
    ({ final, interim }) => {
      const voiceBase = preCursorRef.current + voiceAccumulatedRef.current;

      if (interim) {
        const newValue = voiceBase + interim + postCursorRef.current;
        const cursorPos = voiceBase.length + interim.length;
        inputRef.current?.setValue(newValue, cursorPos);
      }

      if (final) {
        voiceAccumulatedRef.current += (voiceAccumulatedRef.current ? ' ' : '') + final;
        const newValue = preCursorRef.current + voiceAccumulatedRef.current + postCursorRef.current;
        const cursorPos = preCursorRef.current.length + voiceAccumulatedRef.current.length;
        inputRef.current?.setValue(newValue, cursorPos);

        clearSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          const content = inputRef.current?.getInputContent?.() ?? '';
          if (content.trim()) {
            hasSentRef.current = true;
            inputRef.current?.sendQuestion?.();
            inputRef.current?.reset?.();
          }
        }, SILENCE_TIMEOUT_MS);
      }
    },
    [inputRef, clearSilenceTimer],
  );

  const serverHook = useStreamingSpeechRecognition({
    onTranscript: handleTranscript,
    onError: () => {},
    socket,
    projectId,
    asrModel,
  });

  const clientHook = useSpeechRecognition({
    onTranscript: handleTranscript,
    onError: () => {},
  });

  const { isRecording, isSupported, startRecording, stopRecording } = serverHook.isSupported
    ? serverHook
    : clientHook;

  const beginRecording = useCallback(() => {
    preCursorRef.current = '';
    postCursorRef.current = '';
    voiceAccumulatedRef.current = '';
    startRecording();
  }, [startRecording]);

  // Start/stop when speaking mode toggles
  useEffect(() => {
    if (isSpeakingMode && isSupported) {
      beginRecording();
    } else if (!isSpeakingMode) {
      clearSilenceTimer();
      stopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeakingMode]);

  // After send: wait for AI streaming AND TTS to finish, then restart recording
  useEffect(() => {
    if (!isSpeakingMode || !hasSentRef.current) return;
    if (!isStreaming && !isTTSPlaying) {
      hasSentRef.current = false;
      beginRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, isTTSPlaying, isSpeakingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isRecording };
};
