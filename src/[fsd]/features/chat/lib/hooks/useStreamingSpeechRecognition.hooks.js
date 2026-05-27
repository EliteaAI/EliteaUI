import { useCallback, useEffect, useRef, useState } from 'react';

import { isWhisperModel } from '@/[fsd]/features/chat/lib/helpers';
import { sioEvents } from '@/common/constants';

// Buffer sizes at 24 kHz — trade-off between latency and API call frequency
// Whisper is a batch API with rate limits, so larger chunks reduce request frequency.
// Realtime models stream continuously and benefit from lower latency.
const BUFFER_SIZE_WHISPER = 7200; // 300 ms — reduce Whisper API call frequency
const BUFFER_SIZE_REALTIME = 4800; // 200 ms — lower latency for streaming models

// Target sample rate expected by both Whisper and the Realtime API
const TARGET_SAMPLE_RATE = 24000;

// AudioWorklet processor code — runs on the audio thread, not the main thread
const PROCESSOR_CODE = `
class AudioChunkProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 4800;    // output samples at TARGET_SAMPLE_RATE
    this._inputRate = 44100;    // overridden via port message
    this._outputRate = 24000;   // overridden via port message
    this.port.onmessage = (e) => {
      if (e.data?.bufferSize)  this._bufferSize  = e.data.bufferSize;
      if (e.data?.inputRate)   this._inputRate   = e.data.inputRate;
      if (e.data?.outputRate)  this._outputRate  = e.data.outputRate;
    };
  }

  _resample(input) {
    if (this._inputRate === this._outputRate) return input;
    const ratio = this._inputRate / this._outputRate;
    const outLen = Math.round(input.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const src = i * ratio;
      const lo = Math.floor(src);
      const hi = Math.min(lo + 1, input.length - 1);
      out[i] = input[lo] + (input[hi] - input[lo]) * (src - lo);
    }
    return out;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    const resampled = this._resample(channel);
    for (let i = 0; i < resampled.length; i++) {
      this._buffer.push(resampled[i]);
    }

    while (this._buffer.length >= this._bufferSize) {
      const chunk = new Float32Array(this._buffer.splice(0, this._bufferSize));
      this.port.postMessage(chunk);
    }

    return true;
  }
}

registerProcessor('audio-chunk-processor', AudioChunkProcessor);
`;

export const useStreamingSpeechRecognition = ({
  onTranscript,
  onTranscriptDone,
  onSpeechStarted,
  onVadFlush,
  onError,
  socket,
  projectId,
  asrModel,
} = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const workletNodeRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onTranscriptDoneRef = useRef(onTranscriptDone);
  const onSpeechStartedRef = useRef(onSpeechStarted);
  const onVadFlushRef = useRef(onVadFlush);
  const onErrorRef = useRef(onError);
  // Set to false at the start of each new recording session to discard stale
  // events that arrive from the previous session before the new one is ready.
  const acceptEventsRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onTranscriptDoneRef.current = onTranscriptDone;
  }, [onTranscriptDone]);

  useEffect(() => {
    onSpeechStartedRef.current = onSpeechStarted;
  }, [onSpeechStarted]);

  useEffect(() => {
    onVadFlushRef.current = onVadFlush;
  }, [onVadFlush]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Listen for transcription events from backend
  useEffect(() => {
    if (!socket) return;

    const onDelta = ({ delta }) => {
      if (!acceptEventsRef.current) return;
      onTranscriptRef.current?.({ interim: delta, final: '' });
    };

    const onDone = ({ transcript }) => {
      if (!acceptEventsRef.current) return;
      if (transcript) onTranscriptRef.current?.({ interim: '', final: transcript });
      // Always notify so the caller can decrement its pending-speech counter,
      // even when the transcript is empty (short audio, rate-limited, errors).
      onTranscriptDoneRef.current?.();
    };

    const onSpeechStart = () => {
      if (!acceptEventsRef.current) return;
      onSpeechStartedRef.current?.();
    };

    const onVadFlushEvent = () => {
      if (!acceptEventsRef.current) return;
      onVadFlushRef.current?.();
    };

    const onErr = ({ error }) => {
      onErrorRef.current?.(error);
    };

    socket.on(sioEvents.asr_transcript_delta, onDelta);
    socket.on(sioEvents.asr_transcript_done, onDone);
    socket.on(sioEvents.asr_speech_started, onSpeechStart);
    socket.on(sioEvents.asr_vad_flush, onVadFlushEvent);
    socket.on(sioEvents.asr_error, onErr);

    return () => {
      socket.off(sioEvents.asr_transcript_delta, onDelta);
      socket.off(sioEvents.asr_transcript_done, onDone);
      socket.off(sioEvents.asr_speech_started, onSpeechStart);
      socket.off(sioEvents.asr_vad_flush, onVadFlushEvent);
      socket.off(sioEvents.asr_error, onErr);
    };
  }, [socket]);

  const float32ToPcm16Buffer = useCallback(float32Array => {
    const pcm = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm.buffer;
  }, []);

  const startRecording = useCallback(async () => {
    // Discard any late events still arriving from the previous session
    acceptEventsRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Use the browser's native sample rate to avoid cross-rate errors (e.g. Firefox).
      // The worklet resamples to TARGET_SAMPLE_RATE (24 kHz) before sending chunks.
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Register the AudioWorklet processor via a Blob URL
      const blob = new Blob([PROCESSOR_CODE], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-chunk-processor');
      workletNodeRef.current = workletNode;

      // Configure chunk size and sample rates before audio starts flowing
      const bufferSize = isWhisperModel(asrModel?.name) ? BUFFER_SIZE_WHISPER : BUFFER_SIZE_REALTIME;
      workletNode.port.postMessage({
        bufferSize,
        inputRate: audioContext.sampleRate,
        outputRate: TARGET_SAMPLE_RATE,
      });

      workletNode.port.onmessage = e => {
        const pcm16Buffer = float32ToPcm16Buffer(e.data);
        socket.emit(sioEvents.asr_audio_chunk, { audio: pcm16Buffer });
      };

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7; // 1.0 = unity, >1.0 = boost, <1.0 = attenuate
      source.connect(gainNode);
      gainNode.connect(workletNode);
      workletNode.connect(audioContext.destination);

      // Start accepting transcript events for this session
      acceptEventsRef.current = true;

      // Tell backend to open the Realtime WS
      socket.emit(sioEvents.asr_start, {
        project_id: projectId,
        model_name: asrModel?.name,
        model_project_id: asrModel?.project_id,
        language: navigator.language?.split('-')[0] || 'en',
      });

      setIsRecording(true);
    } catch (err) {
      acceptEventsRef.current = false;
      if (err.name === 'NotAllowedError') onErrorRef.current?.('not-allowed');
      else if (err.name === 'NotFoundError') onErrorRef.current?.('audio-capture');
      else onErrorRef.current?.('network');
    }
  }, [socket, projectId, asrModel, float32ToPcm16Buffer]);

  const _releaseAudio = useCallback(() => {
    // Null refs first so concurrent calls (stopRecording + unmount) don't double-close
    const worklet = workletNodeRef.current;
    const ctx = audioContextRef.current;
    const stream = streamRef.current;
    workletNodeRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    worklet?.disconnect();
    if (ctx && ctx.state !== 'closed') ctx.close();
    stream?.getTracks().forEach(t => t.stop());
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    // Block events from this session before tearing down audio so late backend
    // messages (e.g. a final Realtime transcript still in-flight) are discarded.
    acceptEventsRef.current = false;
    _releaseAudio();
    socket?.emit(sioEvents.asr_stop, {});
    setIsRecording(false);
  }, [isRecording, socket, _releaseAudio]);

  // Cleanup on unmount — only emit asr_stop if actually recording
  useEffect(() => {
    return () => {
      if (!streamRef.current) return;
      acceptEventsRef.current = false;
      _releaseAudio();
      socket?.emit(sioEvents.asr_stop, {});
    };
  }, [socket, _releaseAudio]);

  return { isRecording, isSupported: !!asrModel, startRecording, stopRecording };
};
