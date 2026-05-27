import { useCallback, useContext, useEffect, useRef } from 'react';

import { useListModelsQuery } from '@/api/configurations';
import SocketContext from '@/contexts/SocketContext';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useSpeechRecognition } from './useSpeechRecognition.hooks';
import { useStreamingSpeechRecognition } from './useStreamingSpeechRecognition.hooks';

// Realtime models: timeout after this much silence (+ EWMA latency estimate).
const SILENCE_TIMEOUT_MS = 3000;
// Added to SILENCE_TIMEOUT_MS for realtime models to cover in-flight audio
// that hasn't been transcribed yet (network round-trip + ASR model processing).
// Seeded at 500 ms; updated each turn via EWMA.
const INITIAL_LATENCY_ESTIMATE_MS = 500;
const LATENCY_EWMA_ALPHA = 0.3; // weight given to the most-recent sample
// How long the backend VAD waits (silence frames × chunk size) before flushing.
// Used to back-date speechEndedAtRef so the silence timer is relative to when
// the user actually stopped speaking, not when the vad_flush event arrives.
const VAD_SILENCE_MS = 600;

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
  // Tracks when the last interim transcript arrived so we can measure the
  // interim→final round-trip time (network latency + ASR model time).
  const lastInterimTimestampRef = useRef(null);
  // EWMA-smoothed estimate of round-trip latency in ms.
  const latencyEstimateRef = useRef(INITIAL_LATENCY_ESTIMATE_MS);
  // Holds the latest stopRecording so the silence timer can call it without
  // creating a circular declaration dependency (handleTranscript is declared
  // before stopRecording is available from the hooks below).
  const stopRecordingRef = useRef(null);
  // Count of vad_flush events that have not yet been matched by a transcript_done.
  // scheduleSend() only fires when this reaches 0, preventing a premature timer
  // start while the user is still speaking a later sentence.
  const pendingVadFlushesRef = useRef(0);
  // Timestamp (Date.now()) approximating when the user last stopped speaking.
  // Set by handleVadFlush as (now - VAD_SILENCE_MS) to account for the backend
  // silence window. Used to adjust the silence timer so the total perceived
  // silence from the user's perspective equals SILENCE_TIMEOUT_MS.
  const speechEndedAtRef = useRef(null);

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

  // Schedule an auto-send after a silence timeout.
  // For streaming models: totalTimeout = SILENCE_TIMEOUT_MS + latencyEstimate
  // For Whisper: called from handleTranscriptDone with a pre-computed adjusted
  //   delay that accounts for elapsed time since the user actually stopped
  //   speaking (supplied via the optional overrideDelay parameter).
  const scheduleSend = useCallback(
    (overrideDelay = null) => {
      clearSilenceTimer();
      const totalTimeout =
        overrideDelay !== null ? overrideDelay : SILENCE_TIMEOUT_MS + latencyEstimateRef.current;
      silenceTimerRef.current = setTimeout(() => {
        const content = inputRef.current?.getInputContent?.() ?? '';
        if (content.trim()) {
          hasSentRef.current = true;
          inputRef.current?.sendQuestion?.();
          inputRef.current?.reset?.();
          // Pause recording until the AI response and TTS are done
          stopRecordingRef.current?.();
        }
      }, totalTimeout);
    },
    [clearSilenceTimer, inputRef],
  );

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
        // User is actively speaking — cancel any pending auto-send so a
        // natural pause between sentences doesn't trigger a premature send.
        clearSilenceTimer();
        lastInterimTimestampRef.current = Date.now();
        const newValue = voiceBase + interim + postCursorRef.current;
        const cursorPos = voiceBase.length + interim.length;
        lastSetValueRef.current = newValue;
        inputRef.current?.setValue(newValue, cursorPos);
      }

      if (final) {
        // Measure interim→final round-trip and update EWMA latency estimate.
        if (lastInterimTimestampRef.current !== null) {
          const roundTripMs = Date.now() - lastInterimTimestampRef.current;
          latencyEstimateRef.current =
            LATENCY_EWMA_ALPHA * roundTripMs + (1 - LATENCY_EWMA_ALPHA) * latencyEstimateRef.current;
          lastInterimTimestampRef.current = null;
        }
        voiceAccumulatedRef.current += (voiceAccumulatedRef.current ? ' ' : '') + final;
        const newValue = preCursorRef.current + voiceAccumulatedRef.current + postCursorRef.current;
        const cursorPos = preCursorRef.current.length + voiceAccumulatedRef.current.length;
        lastSetValueRef.current = newValue;
        inputRef.current?.setValue(newValue, cursorPos);
        // scheduleSend is triggered by handleTranscriptDone so that the timer
        // is started even when the transcript is empty (short audio, rate-limited).
      }
    },
    [inputRef, clearSilenceTimer],
  );

  // Called when the backend VAD detects the start of a new speech segment.
  // Cancels any pending auto-send timer so a natural pause between sentences
  // does not trigger a premature send while the user is still speaking.
  const handleSpeechStarted = useCallback(() => {
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  // Called when the backend VAD flushes a speech segment (i.e. when speech
  // actually ends, BEFORE the transcript arrives). Increments the pending
  // counter and records when the user stopped speaking so the silence timer
  // can be adjusted relative to that moment rather than transcript arrival.
  const handleVadFlush = useCallback(() => {
    pendingVadFlushesRef.current += 1;
    // Back-date by VAD_SILENCE_MS: the flush fires after the silence window,
    // so the user actually stopped speaking ~VAD_SILENCE_MS ago.
    speechEndedAtRef.current = Date.now() - VAD_SILENCE_MS;
  }, []);

  // Called on every transcript_done event (even when transcript text is empty).
  //
  // Whisper path (vad_flush fired → speechEndedAtRef is set):
  //   Decrements the pending counter. When it reaches 0 (all segments done),
  //   schedules auto-send with a delay adjusted so the total perceived silence
  //   from the user's perspective equals SILENCE_TIMEOUT_MS.
  //
  // Realtime path (no vad_flush → speechEndedAtRef is null):
  //   pendingVadFlushesRef stays 0, speechEndedAtRef stays null.
  //   Falls through to the original scheduleSend() (no override) so realtime
  //   models keep using SILENCE_TIMEOUT_MS + EWMA latency estimate — unchanged.
  const handleTranscriptDone = useCallback(() => {
    if (pendingVadFlushesRef.current > 0) {
      pendingVadFlushesRef.current -= 1;
    }
    if (pendingVadFlushesRef.current === 0) {
      if (speechEndedAtRef.current !== null) {
        // Whisper: compute remaining time to reach SILENCE_TIMEOUT_MS
        const elapsed = Math.max(0, Date.now() - speechEndedAtRef.current);
        speechEndedAtRef.current = null;
        const adjustedDelay = Math.max(200, SILENCE_TIMEOUT_MS - elapsed);
        scheduleSend(adjustedDelay);
      } else {
        // Realtime: unchanged behavior — standard timeout + latency estimate
        scheduleSend();
      }
    }
  }, [scheduleSend]);

  // Called when the user manually edits the input field while speaking mode is
  // active. Resets the auto-send timer so the message is not sent mid-edit.
  const notifyManualEdit = useCallback(() => {
    if (!isSpeakingMode || hasSentRef.current) return;
    scheduleSend();
  }, [isSpeakingMode, scheduleSend]);

  const serverHook = useStreamingSpeechRecognition({
    onTranscript: handleTranscript,
    onTranscriptDone: handleTranscriptDone,
    onSpeechStarted: handleSpeechStarted,
    onVadFlush: handleVadFlush,
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
    pendingVadFlushesRef.current = 0;
    speechEndedAtRef.current = null;
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

  // Manage recording around AI responses:
  // - streaming or TTS active → stop recording, cancel pending send
  // - both finished → restart recording for the next turn
  useEffect(() => {
    if (!isSpeakingMode) return;
    if (isStreaming || isTTSPlaying) {
      clearSilenceTimer();
      stopRecordingRef.current?.();
      hasSentRef.current = true;
    } else if (hasSentRef.current) {
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
