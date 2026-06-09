import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'elitea_voice_config';
const DEFAULT_CONFIG = { voiceName: null, voiceId: null, rate: 1.0, volume: 1.0 };

const loadStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      voiceName: parsed.voiceName ?? null,
      voiceId: parsed.voiceId ?? null,
      rate: typeof parsed.rate === 'number' ? Math.max(0.5, Math.min(2, parsed.rate)) : 1.0,
      volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : 1.0,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const useVoiceConfig = ({ persist = true } = {}) => {
  const [config, setConfigState] = useState(loadStored);
  const [browserVoices, setBrowserVoices] = useState([]);

  // Chrome loads voices asynchronously
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => setBrowserVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const setConfig = useCallback(
    updates => {
      setConfigState(prev => {
        const next = { ...prev, ...updates };
        if (persist) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    },
    [persist],
  );

  // Stable voice reference — prevents Chrome from picking a different voice per utterance
  const resolvedBrowserVoice =
    browserVoices.find(v => v.name === config.voiceName) ?? browserVoices[0] ?? null;

  return { config, setConfig, browserVoices, resolvedBrowserVoice };
};

export { useVoiceConfig };
