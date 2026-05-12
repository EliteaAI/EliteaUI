import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { sioEvents } from '@/common/constants';

const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const isAudioContextSupported = typeof window !== 'undefined' && 'AudioContext' in window;

// Extra pause durations (seconds) inserted after punctuation that is followed by
// whitespace or end-of-string, modelling natural speech rhythm.
const PUNCTUATION_PAUSES = {
  '.': 0.25,
  '!': 0.25,
  '?': 0.25,
  ',': 0.08,
  ';': 0.12,
  ':': 0.12,
  '\n': 0.2,
};

/**
 * Build a char-index → expected-playback-time (seconds) lookup array.
 * Returns { times: Float32Array(text.length + 1), totalEstimated: number }.
 */
const buildCharTimeline = (text, charsPerSec) => {
  const baseInterval = 1 / charsPerSec;
  const times = new Float32Array(text.length + 1);
  let t = 0;
  for (let i = 0; i < text.length; i++) {
    times[i] = t;
    t += baseInterval;
    const pause = PUNCTUATION_PAUSES[text[i]];
    if (pause !== undefined) {
      const next = text[i + 1];
      if (next === undefined || next === ' ' || next === '\n') {
        t += pause;
      }
    }
  }
  times[text.length] = t;
  return { times, totalEstimated: t };
};

/**
 * Binary search: return the largest char index whose expected time is <= t.
 */
const findCharAtTime = (times, t) => {
  if (t <= 0) return 0;
  if (t >= times[times.length - 1]) return times.length - 2;
  let lo = 0;
  let hi = times.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (times[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

/**
 * TTS playback hook using either:
 *   - A server-side TTS model (Socket.IO + Web Audio API) when `ttsModel` + `socket` are provided
 *   - Browser SpeechSynthesis API as fallback
 *
 * Pause/resume for browser SpeechSynthesis is simulated by cancelling and
 * restarting from the last word-boundary position (Chrome doesn't honour
 * speechSynthesis.pause()).
 *
 * Pause/resume for model TTS uses AudioContext.suspend() / .resume() so no
 * audio data is lost while paused.
 *
 * Usage:
 *   const { speak, stop, pause, resume, isPlaying, isPaused } = useTextToSpeech({ ttsModel, socket });
 */
// Reducer that bails out (returns the same reference) when the new range
// is identical to the current one. This prevents unnecessary re-renders
// when the RAF loop calls setSpokenRange on every frame with the same word.
const spokenRangeReducer = (prev, next) => {
  if (next === null) return prev === null ? prev : null;
  if (prev && prev.start === next.start && prev.end === next.end) return prev;
  return next;
};

const useTextToSpeech = ({ ttsModel, socket } = {}) => {
  const [status, setStatus] = useState('idle'); // idle | playing | paused | done | error
  const [spokenRange, setSpokenRange] = useReducer(spokenRangeReducer, null);

  const hasModelTTS = !!(ttsModel && socket && isAudioContextSupported);

  // ── Browser SpeechSynthesis refs ──────────────────────────────────────────
  const utteranceRef = useRef(null);
  const fullTextRef = useRef('');
  const startOffsetRef = useRef(0);
  const lastBoundaryRef = useRef(0);
  const pausedOffsetRef = useRef(0);

  // ── Model TTS (Web Audio) refs ────────────────────────────────────────────
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  // Track all scheduled source nodes so we can stop them immediately
  const scheduledSourcesRef = useRef([]);

  // Highlight tracking refs for model TTS
  const playStartTimeRef = useRef(null); // null = play hasn't started yet
  const totalDurationRef = useRef(0);
  const allChunksReceivedRef = useRef(false);
  // True only when the user explicitly paused — distinguishes user-pause from browser auto-suspend
  const userPausedRef = useRef(false);
  const rafRef = useRef(null);
  // Self-calibrating chars/second rate. Measured from the previous session's
  // (text.length / totalDuration) and reused for the linear estimation phase
  // of the next session before tts_done fires.  Intentionally NOT reset between
  // sessions so the value accumulates across the component's lifetime.
  const calibratedRateRef = useRef(15.4);
  // Punctuation-aware char timeline for the current session.
  // Built in speak() from the TTS text + calibratedRate.
  const charTimelineRef = useRef(null);

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';

  // ─────────────────────────────────────────────────────────────────────────
  // Model TTS helpers
  // ─────────────────────────────────────────────────────────────────────────

  const ensureAudioContext = useCallback((sampleRate = 24000) => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      // Match the context sample rate to the audio to eliminate SRC artifacts
      audioContextRef.current = new AudioContext({ sampleRate });
      nextStartTimeRef.current = 0;
      scheduledSourcesRef.current = [];
      // Master gain node — all chunk gain nodes connect here instead of directly
      // to destination, so we can schedule a fade-out at end-of-stream to prevent
      // the DC-offset click that occurs when the last PCM buffer ends abruptly.
      const masterGain = audioContextRef.current.createGain();
      masterGain.connect(audioContextRef.current.destination);
      masterGainRef.current = masterGain;
      // Resume immediately after creation to satisfy browser autoplay policy
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
    // Do NOT auto-resume an existing context here — the user may have explicitly paused it
    return audioContextRef.current;
  }, []);

  const stopModelAudio = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    scheduledSourcesRef.current.forEach(src => {
      try {
        src.stop();
      } catch {
        // already stopped
      }
    });
    scheduledSourcesRef.current = [];
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    masterGainRef.current = null;
    nextStartTimeRef.current = 0;
    playStartTimeRef.current = null;
    totalDurationRef.current = 0;
    allChunksReceivedRef.current = false;
    charTimelineRef.current = null;
  }, []);

  const playPcm16Chunk = useCallback(
    (audio_base64, sample_rate = 24000) => {
      const ctx = ensureAudioContext(sample_rate);
      if (!ctx) return;

      try {
        const binaryStr = atob(audio_base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const samples = new Float32Array(bytes.byteLength / 2);
        const view = new DataView(bytes.buffer);
        for (let i = 0; i < samples.length; i++) {
          samples[i] = view.getInt16(i * 2, true) / 32768.0;
        }

        const buffer = ctx.createBuffer(1, samples.length, sample_rate);
        buffer.copyToChannel(samples, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // If the browser auto-suspended the context (autoplay policy) and the user
        // hasn't explicitly paused, resume now so chunks aren't scheduled on a
        // frozen timeline (which would cause them to pile up and play in a burst).
        if (ctx.state === 'suspended' && !userPausedRef.current) {
          ctx.resume().catch(() => {});
        }

        // Route through a GainNode so we can apply a short linear ramp on the
        // first chunk (silence → full) to eliminate the click caused by the
        // AudioContext output jumping from 0 to a non-zero first sample.
        const gain = ctx.createGain();
        const isFirstChunk = playStartTimeRef.current === null;
        const FADE_DURATION = 0.005; // 5 ms — inaudible but removes the discontinuity
        if (isFirstChunk) {
          gain.gain.setValueAtTime(0, 0);
        }
        source.connect(gain);
        gain.connect(masterGainRef.current ?? ctx.destination);

        const now = ctx.currentTime;
        const startTime = nextStartTimeRef.current <= now ? now : nextStartTimeRef.current;

        // Apply fade-in ramp on the first chunk only
        if (isFirstChunk) {
          gain.gain.linearRampToValueAtTime(1, startTime + FADE_DURATION);
        }

        // Track when audio playback actually begins (first chunk only)
        if (playStartTimeRef.current === null) {
          playStartTimeRef.current = startTime;
        }

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        scheduledSourcesRef.current.push(source);
        // Prune finished sources to avoid unbounded growth
        source.onended = () => {
          scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[TTS] Failed to decode/play PCM chunk:', err);
      }
    },
    [ensureAudioContext],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Browser SpeechSynthesis helpers
  // ─────────────────────────────────────────────────────────────────────────

  const startUtterance = useCallback((text, offset) => {
    const textToSpeak = offset > 0 ? text.slice(offset) : text;
    if (!textToSpeak.trim()) {
      setStatus('done');
      setSpokenRange(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    startOffsetRef.current = offset;
    lastBoundaryRef.current = 0;

    utterance.onstart = () => setStatus('playing');

    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      setStatus('done');
      setSpokenRange(null);
    };

    utterance.onerror = e => {
      if (utteranceRef.current !== utterance) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      utteranceRef.current = null;
      setStatus('error');
      setSpokenRange(null);
    };

    utterance.onboundary = e => {
      if (e.name !== 'word') return;
      lastBoundaryRef.current = e.charIndex;
      const absStart = offset + e.charIndex;
      setSpokenRange({ start: absStart, end: absStart + (e.charLength ?? 1) });
    };

    setStatus('playing');
    window.speechSynthesis.speak(utterance);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  const speak = useCallback(
    text => {
      if (!text) return;

      if (hasModelTTS) {
        // Cancel any in-flight server session first so stale chunks from the
        // previous TTS stream don't arrive and corrupt the new audio buffer.
        userPausedRef.current = false;
        socket.emit(sioEvents.tts_stop, {});
        stopModelAudio();
        fullTextRef.current = text;
        // Build punctuation-aware timeline for this session's text.
        // Uses the calibrated rate from the previous session (or the default
        // 15.4 chars/sec on first use).  After tts_done fires, the RAF loop
        // scales elapsed time against the real totalDuration so any rate
        // inaccuracy is corrected for the post-streaming phase.
        charTimelineRef.current = buildCharTimeline(text, calibratedRateRef.current);
        // Create the AudioContext eagerly so pause() can suspend it
        // before the first chunk arrives
        ensureAudioContext(24000);
        socket.emit(sioEvents.tts_start, {
          project_id: ttsModel.project_id,
          model_name: ttsModel.name,
          model_project_id: ttsModel.project_id,
          text,
        });
        setStatus('playing');
        setSpokenRange(null);
      } else if (isSpeechSynthesisSupported) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
        fullTextRef.current = text;
        pausedOffsetRef.current = 0;
        startUtterance(text, 0);
      }
    },
    [hasModelTTS, ttsModel, socket, stopModelAudio, startUtterance, ensureAudioContext],
  );

  const pause = useCallback(() => {
    if (status !== 'playing') return;

    if (hasModelTTS) {
      userPausedRef.current = true;
      audioContextRef.current?.suspend();
      setStatus('paused');
    } else if (isSpeechSynthesisSupported) {
      pausedOffsetRef.current = startOffsetRef.current + lastBoundaryRef.current;
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setStatus('paused');
    }
  }, [status, hasModelTTS]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;

    if (hasModelTTS) {
      userPausedRef.current = false;
      audioContextRef.current?.resume();
      setStatus('playing');
    } else if (isSpeechSynthesisSupported) {
      startUtterance(fullTextRef.current, pausedOffsetRef.current);
    }
  }, [status, hasModelTTS, startUtterance]);

  const stop = useCallback(() => {
    if (hasModelTTS) {
      userPausedRef.current = false;
      socket?.emit(sioEvents.tts_stop, {});
      stopModelAudio();
    } else if (isSpeechSynthesisSupported) {
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
    }
    fullTextRef.current = '';
    startOffsetRef.current = 0;
    lastBoundaryRef.current = 0;
    pausedOffsetRef.current = 0;
    setStatus('idle');
    setSpokenRange(null);
  }, [hasModelTTS, socket, stopModelAudio]);

  // ─────────────────────────────────────────────────────────────────────────
  // Socket event listeners for model TTS
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasModelTTS) return;

    const handleChunk = ({ audio_base64, sample_rate }) => {
      playPcm16Chunk(audio_base64, sample_rate);
    };

    const handleDone = () => {
      // Record total audio duration and signal that all chunks are buffered.
      // The RAF loop will call setStatus('done') once the audio actually finishes.
      const bufferedDuration = nextStartTimeRef.current - playStartTimeRef.current;
      totalDurationRef.current = bufferedDuration > 0 ? bufferedDuration : 0;
      allChunksReceivedRef.current = true;
      // Calibrate chars/second for the next session's linear phase
      if (bufferedDuration > 0 && fullTextRef.current.length > 0) {
        calibratedRateRef.current = fullTextRef.current.length / bufferedDuration;
      }
      // Schedule a short linear fade-out on the master gain so the last PCM buffer
      // doesn't end abruptly at a non-zero sample (which causes a DC-offset click).
      const masterGain = masterGainRef.current;
      const ctx = audioContextRef.current;
      if (masterGain && ctx && nextStartTimeRef.current > 0) {
        const FADE_OUT = 0.02; // 20 ms — inaudible but removes the click
        const endTime = nextStartTimeRef.current;
        masterGain.gain.setValueAtTime(1, Math.max(ctx.currentTime, endTime - FADE_OUT));
        masterGain.gain.linearRampToValueAtTime(0, endTime);
      }
    };

    const handleError = ({ error }) => {
      // eslint-disable-next-line no-console
      console.error('[TTS] Server error:', error);
      stopModelAudio();
      setStatus('error');
      setSpokenRange(null);
    };

    socket.on(sioEvents.tts_audio_chunk, handleChunk);
    socket.on(sioEvents.tts_done, handleDone);
    socket.on(sioEvents.tts_error, handleError);

    return () => {
      socket.off(sioEvents.tts_audio_chunk, handleChunk);
      socket.off(sioEvents.tts_done, handleDone);
      socket.off(sioEvents.tts_error, handleError);
    };
  }, [hasModelTTS, socket, playPcm16Chunk, stopModelAudio]);

  // ─────────────────────────────────────────────────────────────────────────
  // RAF loop — word highlighting + completion detection for model TTS
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasModelTTS || status !== 'playing') return;

    const tick = () => {
      const ctx = audioContextRef.current;
      // AudioContext not yet created (first chunk hasn't arrived) — keep waiting
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // AudioContext was closed (stopModelAudio called) — exit loop
      if (ctx.state === 'closed') {
        rafRef.current = null;
        return;
      }

      // Don't highlight until the first chunk has been scheduled.
      // Before that we don't know the real play-start time, so elapsed would be wrong.
      if (playStartTimeRef.current === null) {
        // If tts_done fired before any audio chunk arrived (empty response),
        // complete immediately rather than spinning forever.
        if (allChunksReceivedRef.current) {
          setStatus('done');
          setSpokenRange(null);
          rafRef.current = null;
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Subtract outputLatency so the highlight tracks what the user actually hears,
      // not what has been sent to the audio hardware buffer.
      const elapsed = ctx.currentTime - (ctx.outputLatency ?? 0) - playStartTimeRef.current;
      const text = fullTextRef.current;
      const totalDuration = totalDurationRef.current;
      const allReceived = allChunksReceivedRef.current;

      if (elapsed >= 0 && text) {
        // Use the punctuation-aware char timeline built at speak() time.
        // After tts_done fires we know the real total duration, so we scale
        // elapsed to correct for any rate inaccuracy in the timeline model.
        // Before tts_done the timeline runs at the calibrated rate as-is.
        const timeline = charTimelineRef.current;
        let charPos;
        if (timeline) {
          let scaledElapsed;
          if (allReceived && totalDuration > 0 && timeline.totalEstimated > 0) {
            scaledElapsed = elapsed * (timeline.totalEstimated / totalDuration);
          } else {
            scaledElapsed = elapsed;
          }
          charPos = findCharAtTime(timeline.times, scaledElapsed);
        } else {
          // Fallback if timeline was not built (shouldn't happen in normal flow).
          charPos = Math.min(Math.floor(elapsed * calibratedRateRef.current), text.length - 1);
        }

        // Advance past any whitespace so charPos lands on a word character
        let pos = charPos;
        while (pos < text.length && /\s/.test(text[pos])) pos++;
        let wordStart = pos;
        let wordEnd = pos;
        while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) wordStart--;
        while (wordEnd < text.length && !/\s/.test(text[wordEnd])) wordEnd++;
        if (wordEnd > wordStart) setSpokenRange({ start: wordStart, end: wordEnd });
      }

      // Detect audio completion: all chunks received and playback time elapsed
      if (allReceived && (totalDuration <= 0 || elapsed >= totalDuration)) {
        setStatus('done');
        setSpokenRange(null);
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [hasModelTTS, status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasModelTTS) {
        stopModelAudio();
      } else if (isSpeechSynthesisSupported) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSupported = hasModelTTS || isSpeechSynthesisSupported;

  return { speak, stop, pause, resume, isPlaying, isPaused, isSupported, spokenRange };
};

export { useTextToSpeech };
