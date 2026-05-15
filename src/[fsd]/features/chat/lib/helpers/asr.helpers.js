/**
 * Returns true for batch HTTP transcription models (whisper-1, gpt-4o-transcribe, etc.).
 * Mirrors the backend _is_whisper_model() check in elitea_core/sio/asr.py.
 */
export const isWhisperModel = name =>
  Boolean(name && (name.toLowerCase().includes('whisper') || name.toLowerCase().includes('transcribe')));
