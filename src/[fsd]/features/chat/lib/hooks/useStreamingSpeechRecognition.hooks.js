import { useCallback, useEffect, useRef, useState } from 'react';

import { sioEvents } from '@/common/constants';

// AudioWorklet processor code — runs on the audio thread, not the main thread
const PROCESSOR_CODE = `
class AudioChunkProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 7200; // 300ms at 24kHz
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer.push(channel[i]);
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

      // AudioContext at 24kHz — required by OpenAI Realtime API
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      // Register the AudioWorklet processor via a Blob URL
      const blob = new Blob([PROCESSOR_CODE], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-chunk-processor');
      workletNodeRef.current = workletNode;

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

  const stopRecording = useCallback(() => {
    workletNodeRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    workletNodeRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;

    socket?.emit(sioEvents.asr_stop, {});
    setIsRecording(false);
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      workletNodeRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
      socket?.emit(sioEvents.asr_stop, {});
    };
  }, [socket]);

  return { isRecording, isSupported: !!asrModel, startRecording, stopRecording };
};
