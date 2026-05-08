import { useCallback, useEffect, useRef, useState } from 'react';

import { sioEvents } from '@/common/constants';

// Buffer sizes at 24 kHz — trade-off between latency and API call frequency
// Whisper is a batch API with rate limits, so larger chunks reduce request frequency.
// Realtime models stream continuously and benefit from lower latency.
const BUFFER_SIZE_WHISPER = 7200; // 300 ms — reduce Whisper API call frequency
const BUFFER_SIZE_REALTIME = 4800; // 200 ms — lower latency for streaming models

// Mirrors the backend _is_whisper_model() check
const isWhisperModel = name => Boolean(name && name.toLowerCase().includes('whisper'));

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
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Listen for transcription events from backend
  useEffect(() => {
    if (!socket) return;

    const onDelta = ({ delta }) => {
      onTranscriptRef.current?.({ interim: delta, final: '' });
    };

    const onDone = ({ transcript }) => {
      onTranscriptRef.current?.({ interim: '', final: transcript });
    };

    const onErr = ({ error }) => {
      onErrorRef.current?.(error);
    };

    socket.on(sioEvents.asr_transcript_delta, onDelta);
    socket.on(sioEvents.asr_transcript_done, onDone);
    socket.on(sioEvents.asr_error, onErr);

    return () => {
      socket.off(sioEvents.asr_transcript_delta, onDelta);
      socket.off(sioEvents.asr_transcript_done, onDone);
      socket.off(sioEvents.asr_error, onErr);
    };
  }, [socket]);

  const float32ToPcm16Base64 = useCallback(float32Array => {
    const pcm = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(pcm.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }, []);

  const startRecording = useCallback(async () => {
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
        const base64 = float32ToPcm16Base64(e.data);
        socket.emit(sioEvents.asr_audio_chunk, { audio_base64: base64 });
      };

      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7; // 1.0 = unity, >1.0 = boost, <1.0 = attenuate
      source.connect(gainNode);
      gainNode.connect(workletNode);
      workletNode.connect(audioContext.destination);

      // Tell backend to open the Realtime WS
      socket.emit(sioEvents.asr_start, {
        project_id: projectId,
        model_name: asrModel?.name,
        model_project_id: asrModel?.project_id,
        language: navigator.language?.split('-')[0] || 'en',
      });

      setIsRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError') onErrorRef.current?.('not-allowed');
      else if (err.name === 'NotFoundError') onErrorRef.current?.('audio-capture');
      else onErrorRef.current?.('network');
    }
  }, [socket, projectId, asrModel, float32ToPcm16Base64]);

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
    _releaseAudio();
    socket?.emit(sioEvents.asr_stop, {});
    setIsRecording(false);
  }, [isRecording, socket, _releaseAudio]);

  // Cleanup on unmount — only emit asr_stop if actually recording
  useEffect(() => {
    return () => {
      if (!streamRef.current) return;
      _releaseAudio();
      socket?.emit(sioEvents.asr_stop, {});
    };
  }, [socket, _releaseAudio]);

  return { isRecording, isSupported: !!asrModel, startRecording, stopRecording };
};
