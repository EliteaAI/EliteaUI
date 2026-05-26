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
 *  3. After SILENCE_TIMEOUT_MS of no new final transcript → auto-sends and stops recording
 *  4. Waits for AI to finish streaming AND TTS to finish playing
 *  5. Restarts recording for the next turn
 */
export const useSpeakingModeLoop = ({ isSpeakingMode, inputRef, isStreaming, isTTSPlaying }) => {
  const socket = useContext(SocketContext);
  const projectId = useSelectedProjectId();

  const preCursorRef = useRef('');
  const postCursorRef = useRef('');
  const voiceAccumulatedRef = useRef('');
  const lastSetValueRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSentRef = useRef(false);
  // Holds the latest stopRecording so the silence timer can call it without
  // creating a circular declaration dependency (handleTranscript is declared
  // before stopRecording is available from the hooks below).
  const stopRecordingRef = useRef(null);

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

  // Schedule an auto-send after SILENCE_TIMEOUT_MS of no new activity.
  // Shared by both voice transcripts and manual-edit detection.
  const scheduleSend = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      const content = inputRef.current?.getInputContent?.() ?? '';
      if (content.trim()) {
        hasSentRef.current = true;
        inputRef.current?.sendQuestion?.();
        inputRef.current?.reset?.();
        // Pause recording until the AI response and TTS are done
        stopRecordingRef.current?.();
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer, inputRef]);

  const handleTranscript = useCallback(
    ({ final, interim }) => {
      // Re-sync cursor refs if the user manually edited the input between transcript
      // events (e.g. deleted the previous transcript while still recording).
      if (lastSetValueRef.current !== null) {
        const currentContent = inputRef.current?.getInputContent() ?? '';
        if (currentContent !== lastSetValueRef.current) {
          const cursor = inputRef.current?.getCursorPosition() ?? currentContent.length;
          preCursorRef.current = currentContent.slice(0, cursor);
          postCursorRef.current = currentContent.slice(cursor);
          voiceAccumulatedRef.current = '';
        }
      }

      const voiceBase = preCursorRef.current + voiceAccumulatedRef.current;

      if (interim) {
        const newValue = voiceBase + interim + postCursorRef.current;
        const cursorPos = voiceBase.length + interim.length;
        lastSetValueRef.current = newValue;
        inputRef.current?.setValue(newValue, cursorPos);
      }

      if (final) {
        voiceAccumulatedRef.current += (voiceAccumulatedRef.current ? ' ' : '') + final;
        const newValue = preCursorRef.current + voiceAccumulatedRef.current + postCursorRef.current;
        const cursorPos = preCursorRef.current.length + voiceAccumulatedRef.current.length;
        lastSetValueRef.current = newValue;
        inputRef.current?.setValue(newValue, cursorPos);

        scheduleSend();
      }
    },
    [inputRef, scheduleSend],
  );

  // Called when the user manually edits the input field while speaking mode is
  // active. Resets the auto-send timer so the message is not sent mid-edit.
  const notifyManualEdit = useCallback(() => {
    if (!isSpeakingMode || hasSentRef.current) return;
    scheduleSend();
  }, [isSpeakingMode, scheduleSend]);

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

  // Keep the ref in sync so the silence timer always calls the latest version
  stopRecordingRef.current = stopRecording;

  const beginRecording = useCallback(() => {
    preCursorRef.current = '';
    postCursorRef.current = '';
    voiceAccumulatedRef.current = '';
    lastSetValueRef.current = '';
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

  // Called by external actions that trigger a new AI response (e.g. Regenerate).
  // Stops recording and activates the restart guard, identical to the auto-send path.
  const pauseForRegeneration = useCallback(() => {
    if (!isSpeakingMode) return;
    clearSilenceTimer();
    stopRecordingRef.current?.();
    hasSentRef.current = true;
  }, [isSpeakingMode, clearSilenceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isRecording, pauseForRegeneration, notifyManualEdit };
};
