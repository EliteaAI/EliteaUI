import { SoundNotificationsStorageKey } from '@/common/constants';

const STORAGE_KEY = SoundNotificationsStorageKey;
const DEFAULT_CONFIG = { enabled: true, volume: 0.5 };

export const loadSoundConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_CONFIG.enabled,
      volume:
        typeof parsed.volume === 'number' ? Math.max(0, Math.min(1, parsed.volume)) : DEFAULT_CONFIG.volume,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
};

export const saveSoundConfig = config => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
};

let sharedAudioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctx();
  }
  // Background tabs auto-suspend the context; this feature fires precisely then.
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playTone = (audioCtx, frequency, startTime, duration, gainValue) => {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(gainValue, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// tones: [{ frequency, offset, duration, gain }] where gain is a 0..1 multiplier of configured volume
const playSequence = tones => {
  const { enabled, volume } = loadSoundConfig();
  if (!enabled) return;

  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    tones.forEach(({ frequency, offset, duration, gain }) =>
      playTone(audioCtx, frequency, now + offset, duration, volume * gain),
    );
  } catch {
    /* Web Audio API unavailable */
  }
};

// Final completion of a chat response or pipeline run — ascending two-tone "ding"
export const playCompletionSound = () =>
  playSequence([
    { frequency: 880, offset: 0, duration: 0.15, gain: 0.4 },
    { frequency: 1108, offset: 0.12, duration: 0.25, gain: 0.35 },
  ]);

// A failed tool or LLM step — descending two-tone
export const playErrorSound = () =>
  playSequence([
    { frequency: 440, offset: 0, duration: 0.18, gain: 0.4 },
    { frequency: 330, offset: 0.15, duration: 0.3, gain: 0.35 },
  ]);

// True when the user is not actively looking at the page that ran the task:
// the tab is backgrounded/minimized (document.hidden) or the window lost focus
// (e.g. switched to another app on a second monitor while the tab stays visible).
// Quick tasks finish while the user is still watching, so this naturally limits
// audible feedback to long-running tasks they have stepped away from.
export const isPageInactive = () => {
  if (typeof document === 'undefined') return false;
  return document.hidden || !document.hasFocus();
};

// Completion/error notifications for task events. These fire only when the page
// is inactive, so users actively watching the UI are not interrupted by every
// response. The raw play* functions stay ungated for the settings Preview button.
export const notifyTaskComplete = () => {
  if (isPageInactive()) playCompletionSound();
};

export const notifyTaskError = () => {
  if (isPageInactive()) playErrorSound();
};
