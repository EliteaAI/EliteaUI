import { useCallback, useEffect, useRef, useState } from 'react';

import { sioEvents } from '@/common/constants';

const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const isAudioContextSupported = typeof window !== 'undefined' && 'AudioContext' in window;

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
const useTextToSpeech = ({ ttsModel, socket } = {}) => {
  const [status, setStatus] = useState('idle'); // idle | playing | paused | done | error
  const [spokenRange, setSpokenRange] = useState(null);

  const hasModelTTS = !!(ttsModel && socket && isAudioContextSupported);

  // ── Browser SpeechSynthesis refs ──────────────────────────────────────────
  const utteranceRef = useRef(null);
  const fullTextRef = useRef('');
  const startOffsetRef = useRef(0);
  const lastBoundaryRef = useRef(0);
  const pausedOffsetRef = useRef(0);

  // ── Model TTS (Web Audio) refs ────────────────────────────────────────────
  const audioContextRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  // Track all scheduled source nodes so we can stop them immediately
  const scheduledSourcesRef = useRef([]);

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';

  // ─────────────────────────────────────────────────────────────────────────
  // Model TTS helpers
  // ─────────────────────────────────────────────────────────────────────────

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
      nextStartTimeRef.current = 0;
      scheduledSourcesRef.current = [];
    }
    return audioContextRef.current;
  }, []);

  const stopModelAudio = useCallback(() => {
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
    nextStartTimeRef.current = 0;
  }, []);

  const playPcm16Chunk = useCallback(
    (audio_base64, sample_rate = 24000) => {
      const ctx = ensureAudioContext();
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
        source.connect(ctx.destination);

        const now = ctx.currentTime;
        const startTime = nextStartTimeRef.current <= now ? now : nextStartTimeRef.current;
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
        stopModelAudio();
        fullTextRef.current = text;
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
    [hasModelTTS, ttsModel, socket, stopModelAudio, startUtterance],
  );

  const pause = useCallback(() => {
    if (status !== 'playing') return;

    if (hasModelTTS) {
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
      audioContextRef.current?.resume();
      setStatus('playing');
    } else if (isSpeechSynthesisSupported) {
      startUtterance(fullTextRef.current, pausedOffsetRef.current);
    }
  }, [status, hasModelTTS, startUtterance]);

  const stop = useCallback(() => {
    if (hasModelTTS) {
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
      setStatus('done');
      setSpokenRange(null);
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
