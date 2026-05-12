import { useCallback, useEffect, useRef, useState } from 'react';

export const useSpeechRecognition = ({ onTranscript, onError } = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const handleResult = useCallback(event => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    onTranscriptRef.current?.({ final: finalTranscript, interim: interimTranscript });
  }, []);

  const handleError = useCallback(event => {
    setIsRecording(false);
    recognitionRef.current = null;
    // Ignore aborted sessions (triggered by stopRecording)
    if (event.error === 'aborted') return;
    onErrorRef.current?.(event.error);
  }, []);

  const handleEnd = useCallback(() => {
    setIsRecording(false);
    recognitionRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Abort any existing session before starting a new one
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [handleResult, handleError, handleEnd]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Abort on unmount to avoid dangling event listeners
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { isRecording, isSupported, startRecording, stopRecording };
};
