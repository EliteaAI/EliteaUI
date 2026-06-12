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

/** Decode raw binary PCM-16-LE to a Float32Array of normalised [-1, 1] samples. */
const decodePcm16 = audio => {
  const bytes =
    audio instanceof ArrayBuffer
      ? new Uint8Array(audio)
      : new Uint8Array(audio.buffer, audio.byteOffset, audio.byteLength);
  const samples = new Float32Array(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 32768.0;
  }
  return samples;
};

const spokenRangeReducer = (prev, next) => {
  if (next === null) return prev === null ? prev : null;
  if (prev && prev.start === next.start && prev.end === next.end) return prev;
  return next;
};

const useTextToSpeech = ({ ttsModel, socket, voiceConfig } = {}) => {
  const [status, setStatus] = useState('idle'); // idle | playing | paused | done | error
  const [spokenRange, setSpokenRange] = useReducer(spokenRangeReducer, null);

  const hasModelTTS = !!(ttsModel && socket && isAudioContextSupported);

  // ── Browser SpeechSynthesis refs ──────────────────────────────────────────
  const utteranceRef = useRef(null);
  const fullTextRef = useRef('');
  const startOffsetRef = useRef(0);
  const lastBoundaryRef = useRef(0);
  const pausedOffsetRef = useRef(0);
  // Wall-clock time (performance.now()) when the current utterance actually started
  // playing. Set in utterance.onstart. Used by the browser TTS RAF loop to estimate
  // the current word position when onboundary events don't fire (common in Chrome).
  const browserSpeechStartTimeRef = useRef(null);
  // Wall-clock time of the most recent onboundary event for this utterance.
  // When this is recent (< 200 ms ago) the browser is firing boundary events
  // (Safari / Firefox) and the RAF loop yields to them instead of overwriting.
  const lastBoundaryTimeRef = useRef(null);

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
  // Mirror of voiceConfig as a ref so the tts_done handler (closed over at mount)
  // can read the latest value without being in the effect's dependency list.
  const voiceConfigRef = useRef(voiceConfig);
  // Mirror of socket so the RAF loop can emit tts_next without being in its dep array.
  const socketRef = useRef(socket);
  // Index of the next sentence waypoint for which tts_next has not yet been emitted.
  // Counts up as the RAF loop emits ACKs; reset to 0 at the start of each session.
  const sentenceNextAckedRef = useRef(0);
  // Set to true when voice/speed settings change during playback so the RAF loop
  // emits tts_next immediately instead of waiting for the buffer to drain.
  const forceNextAckRef = useRef(false);
  const rafRef = useRef(null);
  // Self-calibrating chars/second rate. Measured from the previous session's
  // (text.length / totalDuration) and reused for the linear estimation phase
  // of the next session before tts_done fires.  Intentionally NOT reset between
  // sessions so the value accumulates across the component's lifetime.
  const calibratedRateRef = useRef(15.4);
  // Punctuation-aware char timeline for the current session.
  // Built in speak() from the TTS text + calibratedRate.
  const charTimelineRef = useRef(null);
  // Sentence waypoints: exact { charPos, audioTime } anchors received from the
  // backend tts_done events that carry char_end.  audioTime is seconds elapsed
  // from playback start (nextStartTimeRef - playStartTimeRef at the moment the
  // sentence's audio finishes buffering).  Used for linear interpolation in the
  // RAF loop to give near-exact word highlight synchronisation.
  const sentenceWaypointsRef = useRef([]); // [{ charPos, audioTime }]
  // 1-chunk pipeline buffer. A fade-out is applied to the tail of the pending chunk
  // right before it is scheduled, and a fade-in to the head of the first chunk of
  // each new sentence. This eliminates amplitude discontinuities at sentence
  // boundaries (the main source of audible pops).
  const pendingChunkRef = useRef(null); // { samples: Float32Array, sample_rate }
  // True at the start of every sentence — reset after the first chunk of that sentence is enqueued.
  const newSentenceRef = useRef(true);
  // Buffered-playback refs — incoming PCM is queued here; a scheduler loop
  // pulls from it and pre-schedules audio into the AudioContext to prevent
  // buffer underruns caused by network jitter.
  const pcmQueueRef = useRef([]); // [{ samples: Float32Array, sampleRate: number }]
  const schedulerTimerRef = useRef(null); // setInterval ID for the scheduler loop
  const finalTtsDoneRef = useRef(false); // true once the final tts_done (no char_end) fires
  // Monotonically-increasing count of samples enqueued this session — used to
  // compute sentence-waypoint audioTime independently of how far the scheduler
  // has advanced, so waypoints are correct even when buffering introduces lag.
  const totalEnqueuedSamplesRef = useRef(0);
  const sampleRateRef = useRef(24000); // sample rate of the current TTS stream

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';

  // ─────────────────────────────────────────────────────────────────────────
  // Model TTS helpers
  // ─────────────────────────────────────────────────────────────────────────

  const ensureAudioContext = useCallback(
    (sampleRate = 24000) => {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        // Match the context sample rate to the audio to eliminate SRC artifacts
        audioContextRef.current = new AudioContext({ sampleRate });
        nextStartTimeRef.current = 0;
        scheduledSourcesRef.current = [];
        // Master gain node — all chunk gain nodes connect here instead of directly
        // to destination, so we can schedule a fade-out at end-of-stream to prevent
        // the DC-offset click that occurs when the last PCM buffer ends abruptly.
        const masterGain = audioContextRef.current.createGain();
        masterGain.gain.value = voiceConfig?.volume ?? 1.0;
        masterGain.connect(audioContextRef.current.destination);
        masterGainRef.current = masterGain;
        // Resume immediately after creation to satisfy browser autoplay policy
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
      // Do NOT auto-resume an existing context here — the user may have explicitly paused it
      return audioContextRef.current;
    },
    [voiceConfig?.volume],
  );

  // Keep voiceConfigRef and socketRef in sync so RAF-loop closures always read current values
  useEffect(() => {
    voiceConfigRef.current = voiceConfig;
  }, [voiceConfig]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // When voice or speed changes DURING active playback, signal the RAF loop to
  // emit tts_next immediately so the new settings reach the backend without delay.
  // Guard with playStartTimeRef so changes before playback begins are ignored —
  // they would otherwise set force=true and fire the first ACK prematurely.
  useEffect(() => {
    if (playStartTimeRef.current !== null) {
      forceNextAckRef.current = true;
    }
  }, [voiceConfig?.voiceId, voiceConfig?.rate]);

  // Live volume change — ramp to avoid click artifact when volume slider moves during playback
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!masterGainRef.current || !ctx || ctx.state === 'closed') return;
    masterGainRef.current.gain.linearRampToValueAtTime(voiceConfig?.volume ?? 1.0, ctx.currentTime + 0.05);
  }, [voiceConfig?.volume]);

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
    sentenceWaypointsRef.current = [];
    sentenceNextAckedRef.current = 0;
    forceNextAckRef.current = false;
    pendingChunkRef.current = null;
    newSentenceRef.current = true;
    clearInterval(schedulerTimerRef.current);
    schedulerTimerRef.current = null;
    pcmQueueRef.current = [];
    finalTtsDoneRef.current = false;
    totalEnqueuedSamplesRef.current = 0;
  }, []);

  // Push decoded samples into the playback queue. All fades must be applied
  // in-place by the caller before this function is called. The scheduler loop
  // (scheduleFromQueue) is responsible for actually sending buffers to the
  // AudioContext — that decoupling is what prevents buffer underruns.
  //
  // Tiny fragments (< 1 render quantum = 128 samples) are merged into the
  // previous queue entry instead of being scheduled as separate AudioBufferSourceNodes.
  // The HTTP chunked-transfer encoding occasionally produces 1–4 byte trailing
  // fragments at sentence boundaries, which cause amplitude discontinuities
  // when played back as individual 1–2 sample buffers (below the Web Audio
  // render quantum), manifesting as audible pops.
  const enqueueSamples = useCallback((samples, sampleRate = 24000) => {
    sampleRateRef.current = sampleRate;
    const QUANTUM = 128; // Web Audio API render quantum — sub-quantum buffers cause pops
    if (samples.length < QUANTUM && pcmQueueRef.current.length > 0) {
      // Merge tiny fragment into the tail of the previous segment
      const last = pcmQueueRef.current[pcmQueueRef.current.length - 1];
      const merged = new Float32Array(last.samples.length + samples.length);
      merged.set(last.samples, 0);
      merged.set(samples, last.samples.length);
      pcmQueueRef.current[pcmQueueRef.current.length - 1] = { samples: merged, sampleRate };
    } else {
      pcmQueueRef.current.push({ samples, sampleRate });
    }
    totalEnqueuedSamplesRef.current += samples.length;
  }, []);

  // Scheduler tick — invoked by setInterval every 25 ms.
  // Pulls segments from pcmQueueRef and pre-schedules them into the AudioContext
  // up to LOOKAHEAD seconds ahead of ctx.currentTime.
  //
  // A 200 ms pre-roll is enforced before the first buffer is scheduled so that
  // transient network delays cannot immediately cause an underrun. Once the pre-roll
  // is met (or the final tts_done has fired), playback begins and the scheduler
  // keeps the lookahead window filled on every tick.
  const scheduleFromQueue = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    if (ctx.state === 'suspended' && !userPausedRef.current) {
      ctx.resume().catch(() => {});
      return;
    }

    const sr = sampleRateRef.current;
    const PREROLL_SAMPLES = Math.floor(sr * 0.2); // 200 ms worth of samples
    const LOOKAHEAD = 0.25; // schedule up to 250 ms ahead of current time

    // Hold off until enough data is buffered, unless the stream is already done.
    if (playStartTimeRef.current === null) {
      const queued = pcmQueueRef.current.reduce((sum, seg) => sum + seg.samples.length, 0);
      if (queued < PREROLL_SAMPLES && !finalTtsDoneRef.current) {
        return;
      }
    }

    const now = ctx.currentTime;
    const scheduleUntil = now + LOOKAHEAD;

    while (nextStartTimeRef.current < scheduleUntil) {
      const segment = pcmQueueRef.current.shift();
      if (!segment) break;

      try {
        const { samples, sampleRate } = segment;
        const buffer = ctx.createBuffer(1, samples.length, sampleRate);
        buffer.copyToChannel(samples, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(masterGainRef.current ?? ctx.destination);

        const startTime = Math.max(nextStartTimeRef.current, now);

        if (playStartTimeRef.current === null) {
          playStartTimeRef.current = startTime;
        }

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        scheduledSourcesRef.current.push(source);
        source.onended = () => {
          scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[TTS] Failed to schedule PCM chunk:', err);
      }
    }

    // Stream completion: final tts_done fired and the queue has been fully drained.
    if (finalTtsDoneRef.current && pcmQueueRef.current.length === 0 && !allChunksReceivedRef.current) {
      const bufferedDuration =
        playStartTimeRef.current !== null ? nextStartTimeRef.current - playStartTimeRef.current : 0;
      totalDurationRef.current = bufferedDuration > 0 ? bufferedDuration : 0;
      if (bufferedDuration > 0 && fullTextRef.current.length > 0) {
        calibratedRateRef.current = fullTextRef.current.length / bufferedDuration;
      }
      // Fade out master gain at end-of-stream to silence any DC-offset click
      // that would occur if the last PCM buffer ends at a non-zero sample.
      const masterGain = masterGainRef.current;
      if (masterGain && nextStartTimeRef.current > 0) {
        const FADE_OUT = 0.02; // 20 ms
        const endTime = nextStartTimeRef.current;
        masterGain.gain.setValueAtTime(1, Math.max(now, endTime - FADE_OUT));
        masterGain.gain.linearRampToValueAtTime(0, endTime);
      }
      allChunksReceivedRef.current = true;
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Browser SpeechSynthesis helpers
  // ─────────────────────────────────────────────────────────────────────────

  const startUtterance = useCallback(
    (text, offset) => {
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
      browserSpeechStartTimeRef.current = null;
      lastBoundaryTimeRef.current = null;

      // Build a char-timeline for the remaining text so the RAF polling loop
      // can estimate the current word position even when onboundary doesn't fire.
      const speechRate = calibratedRateRef.current * (voiceConfig?.rate ?? 1.0);
      charTimelineRef.current = buildCharTimeline(textToSpeak, speechRate);

      // Apply voice config to every utterance, including resume-from-pause.
      // Without this Chrome may silently assign a different voice to each utterance.
      if (voiceConfig?.voice) utterance.voice = voiceConfig.voice;
      utterance.rate = voiceConfig?.rate ?? 1.0;
      utterance.volume = voiceConfig?.volume ?? 1.0;

      utterance.onstart = () => {
        browserSpeechStartTimeRef.current = performance.now();
        setStatus('playing');
      };

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
        lastBoundaryTimeRef.current = performance.now();
        const absStart = offset + e.charIndex;
        setSpokenRange({ start: absStart, end: absStart + (e.charLength ?? 1) });
      };

      setStatus('playing');
      window.speechSynthesis.speak(utterance);
    },
    [voiceConfig],
  );

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
        sentenceWaypointsRef.current = [];
        sentenceNextAckedRef.current = 0;
        forceNextAckRef.current = false;
        fullTextRef.current = text;
        // Build punctuation-aware timeline for this session's text.
        // Uses the calibrated rate from the previous session (or the default
        // 15.4 chars/sec on first use).  After tts_done fires, the RAF loop
        // scales elapsed time against the real totalDuration so any rate
        // inaccuracy is corrected for the post-streaming phase.
        charTimelineRef.current = buildCharTimeline(text, calibratedRateRef.current);
        pcmQueueRef.current = [];
        finalTtsDoneRef.current = false;
        totalEnqueuedSamplesRef.current = 0;
        // Create the AudioContext eagerly so pause() can suspend it
        // before the first chunk arrives
        ensureAudioContext(24000);
        // Start the scheduler loop — it holds off playing until the pre-roll is met.
        clearInterval(schedulerTimerRef.current);
        schedulerTimerRef.current = setInterval(scheduleFromQueue, 25);
        socket.emit(sioEvents.tts_start, {
          project_id: ttsModel.project_id,
          model_name: ttsModel.name,
          model_project_id: ttsModel.project_id,
          text,
          voice: voiceConfig?.voiceId || undefined,
          speed: voiceConfig?.rate ?? 1.0,
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
    [
      hasModelTTS,
      ttsModel,
      socket,
      voiceConfig,
      stopModelAudio,
      startUtterance,
      ensureAudioContext,
      scheduleFromQueue,
    ],
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

    // Apply a linear fade-in or fade-out over FADE_SAMPLES samples in-place.
    // 5 ms at 24 kHz = 120 samples — inaudible but sufficient to eliminate
    // amplitude discontinuities at sentence boundaries.
    const applyFade = (samples, fadeSamples, type) => {
      const count = Math.min(fadeSamples, samples.length);
      if (type === 'in') {
        for (let i = 0; i < count; i++) {
          samples[i] *= i / count;
        }
      } else {
        const start = samples.length - count;
        for (let i = 0; i < count; i++) {
          samples[start + i] *= (count - 1 - i) / count;
        }
      }
    };

    const handleChunk = ({ audio, sample_rate }) => {
      const sr = sample_rate || 24000;
      const FADE_SAMPLES = Math.floor(sr * 0.005); // 5 ms

      const samples = decodePcm16(audio);

      // Apply fade-in to the head of the first chunk of each sentence so the
      // amplitude ramps up from 0 rather than jumping in abruptly after the
      // silence left by the previous sentence's fade-out.
      if (newSentenceRef.current) {
        applyFade(samples, FADE_SAMPLES, 'in');
        newSentenceRef.current = false;
      }

      // Flush the previous pending chunk as-is — consecutive chunks within a
      // sentence are contiguous PCM bytes, so no fade is needed at this boundary.
      if (pendingChunkRef.current) {
        enqueueSamples(pendingChunkRef.current.samples, pendingChunkRef.current.sample_rate);
        pendingChunkRef.current = null;
      }

      // Hold the new chunk; it will be flushed with a fade-out when the
      // sentence-boundary tts_done arrives, or as-is if more chunks follow.
      pendingChunkRef.current = { samples, sample_rate: sr };
    };

    const handleDone = ({ char_end } = {}) => {
      const sr = pendingChunkRef.current?.sample_rate || 24000;
      const FADE_SAMPLES = Math.floor(sr * 0.005); // 5 ms

      if (char_end !== undefined) {
        // Sentence boundary — apply fade-out to the last pending chunk so the
        // waveform tapers to zero before the next sentence's fade-in begins.
        if (pendingChunkRef.current) {
          const { samples, sample_rate } = pendingChunkRef.current;
          applyFade(samples, FADE_SAMPLES, 'out');
          enqueueSamples(samples, sample_rate);
          pendingChunkRef.current = null;
        }
        newSentenceRef.current = true;

        // Compute waypoint audioTime from total samples enqueued rather than from
        // nextStartTimeRef, because the scheduler may not have processed the queue
        // yet — using enqueued count gives the correct absolute playback position
        // regardless of scheduling lag.
        const audioTime = totalEnqueuedSamplesRef.current / sampleRateRef.current;
        // Record waypoint — the RAF loop will emit tts_next when playback
        // approaches this boundary, pacing the backend to actual playback speed.
        sentenceWaypointsRef.current.push({ charPos: char_end, audioTime });
        return;
      }

      // Final tts_done — flush the last pending chunk without an extra fade-out:
      // the master-gain ramp in scheduleFromQueue handles the end-of-stream click.
      if (pendingChunkRef.current) {
        const { samples, sample_rate } = pendingChunkRef.current;
        enqueueSamples(samples, sample_rate);
        pendingChunkRef.current = null;
      }

      // Signal that all chunks have been received. The scheduler loop
      // (scheduleFromQueue) will set allChunksReceivedRef once the queue drains,
      // at which point it also records totalDuration and schedules the fade-out.
      finalTtsDoneRef.current = true;
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
  }, [hasModelTTS, socket, enqueueSamples, stopModelAudio]);

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

      // ── tts_next pacing ──────────────────────────────────────────────────────
      // ACK the backend when elapsed playback time reaches LEAD_TIME_S seconds
      // before the END of the PREVIOUS sentence.  This keeps the backend exactly
      // 1 sentence ahead: it starts generating sentence N+1 while sentence N-1
      // still has LEAD_TIME_S seconds left to play.
      //
      //   nextAcked == 0  → no previous boundary; fire immediately so sentence 2
      //                     is ready before sentence 1 ends.
      //   nextAcked >  0  → fire when elapsed >=
      //                       waypoints[nextAcked-1].audioTime – LEAD_TIME_S
      //
      // Short sentences (duration < LEAD_TIME_S) will still cascade immediately
      // because the condition is negative — unavoidable without risking a gap.
      // Longer sentences are paced one-per-sentence so the backend never runs
      // far ahead of playback, keeping voice/speed changes responsive.
      //
      // forceNextAckRef: fires immediately when voice/speed changes mid-playback
      // so the new settings take effect at the very next sentence boundary.
      const LEAD_TIME_S = 3;
      const nextAcked = sentenceNextAckedRef.current;
      if (nextAcked < sentenceWaypointsRef.current.length) {
        const prevAudioTime = nextAcked > 0 ? sentenceWaypointsRef.current[nextAcked - 1].audioTime : 0;
        if (forceNextAckRef.current || elapsed >= prevAudioTime - LEAD_TIME_S) {
          socketRef.current?.emit(sioEvents.tts_next, {
            voice: voiceConfigRef.current?.voiceId || undefined,
            speed: voiceConfigRef.current?.rate ?? 1.0,
          });
          sentenceNextAckedRef.current = nextAcked + 1;
          forceNextAckRef.current = false;
        }
      }

      const text = fullTextRef.current;
      const totalDuration = totalDurationRef.current;
      const allReceived = allChunksReceivedRef.current;

      if (elapsed >= 0 && text) {
        const waypoints = sentenceWaypointsRef.current;
        let charPos;

        if (waypoints.length > 0) {
          // Interpolate between exact sentence-boundary anchors sent by the backend.
          // Build anchor list starting at (0, 0); append final (text.length, totalDuration)
          // once all audio is buffered so the last sentence also interpolates correctly.
          const anchors = [{ charPos: 0, audioTime: 0 }, ...waypoints];
          if (allReceived && totalDuration > 0) {
            anchors.push({ charPos: text.length, audioTime: totalDuration });
          }

          let found = false;
          for (let i = 1; i < anchors.length; i++) {
            if (elapsed <= anchors[i].audioTime) {
              const prev = anchors[i - 1];
              const next = anchors[i];
              const segDuration = next.audioTime - prev.audioTime;
              const t = segDuration > 0 ? Math.min(1, (elapsed - prev.audioTime) / segDuration) : 0;
              charPos = prev.charPos + Math.floor(t * (next.charPos - prev.charPos));
              found = true;
              break;
            }
          }

          if (!found) {
            // Past all known anchors — extrapolate with calibrated rate.
            const last = anchors[anchors.length - 1];
            charPos = Math.min(
              text.length - 1,
              last.charPos + Math.floor((elapsed - last.audioTime) * calibratedRateRef.current),
            );
          }
        } else {
          // No waypoints yet — use the punctuation-aware char timeline.
          const timeline = charTimelineRef.current;
          if (timeline) {
            let scaledElapsed;
            if (allReceived && totalDuration > 0 && timeline.totalEstimated > 0) {
              scaledElapsed = elapsed * (timeline.totalEstimated / totalDuration);
            } else {
              scaledElapsed = elapsed;
            }
            charPos = findCharAtTime(timeline.times, scaledElapsed);
          } else {
            charPos = Math.min(Math.floor(elapsed * calibratedRateRef.current), text.length - 1);
          }
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

  // ─────────────────────────────────────────────────────────────────────────
  // RAF loop — word highlighting fallback for browser SpeechSynthesis
  //
  // Chrome's onboundary events are unreliable (often don't fire for word
  // boundaries at all). This loop estimates the current word using a
  // char-timeline built at utterance start.
  //
  // Safari and Firefox fire onboundary correctly. The moment the first
  // boundary event fires for an utterance, this loop exits permanently
  // (lastBoundaryTimeRef becomes non-null) and onboundary drives the
  // highlight alone. Running both simultaneously causes the back-and-forth
  // jump the user sees when the RAF estimate and onboundary positions differ.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasModelTTS || status !== 'playing') return;

    const tick = () => {
      // Wait until onstart fires and records the start time
      if (browserSpeechStartTimeRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // If any boundary event has fired for this utterance the browser supports
      // onboundary (Safari / Firefox). Exit the RAF loop entirely — onboundary
      // drives the highlight from here on so the two mechanisms don't conflict.
      if (lastBoundaryTimeRef.current !== null) {
        rafRef.current = null;
        return;
      }

      const now = performance.now();
      const elapsed = (now - browserSpeechStartTimeRef.current) / 1000;
      const text = fullTextRef.current;
      const offset = startOffsetRef.current;

      if (elapsed >= 0 && text) {
        const timeline = charTimelineRef.current;
        let relativePos;
        if (timeline) {
          relativePos = findCharAtTime(timeline.times, elapsed);
        } else {
          relativePos = Math.min(Math.floor(elapsed * calibratedRateRef.current), text.length - offset - 1);
        }
        const absPos = offset + relativePos;

        // Advance past whitespace to land on a word character
        let pos = absPos;
        while (pos < text.length && /\s/.test(text[pos])) pos++;
        let wordStart = pos;
        let wordEnd = pos;
        while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) wordStart--;
        while (wordEnd < text.length && !/\s/.test(text[wordEnd])) wordEnd++;
        if (wordEnd > wordStart) setSpokenRange({ start: wordStart, end: wordEnd });
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
