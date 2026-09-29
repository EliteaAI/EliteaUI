import {
  LLM_MODEL_EFFORT_LEVELS,
  LLM_MODEL_EFFORT_LEVEL_LABELS,
  LLM_MODEL_EFFORT_NONE,
  LLM_MODEL_FIELDS,
  LLM_MODEL_REASONING_DESCRIPTIONS,
  LLM_MODEL_RECOGNITION_TEXTS,
  LLM_MODEL_RECOGNITION_TONES,
} from '../constants/llmModelForm.constants.js';

// Mirrors the backend rule; the payload's `matching` block is the source of truth when present.
const DEFAULT_NAME_NORMALIZATION = { lowercase: true, replace: { '.': '-', _: '-' } };

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeLlmModelName = (name, normalization = DEFAULT_NAME_NORMALIZATION) => {
  let normalized = String(name ?? '').trim();
  if (normalization?.lowercase) normalized = normalized.toLowerCase();
  Object.entries(normalization?.replace || {}).forEach(([from, to]) => {
    normalized = normalized.split(from).join(to);
  });
  return normalized;
};

const tokenMatches = (token, normalizedName) =>
  new RegExp(`${escapeRegExp(token)}(?!\\d)`).test(normalizedName);

export const recognizeLlmModelProfile = (name, profilesPayload) => {
  const normalized = normalizeLlmModelName(name, profilesPayload?.matching?.normalize);
  if (!normalized) return null;
  return (
    (profilesPayload?.profiles || []).find(profile =>
      (profile.match || []).some(token => tokenMatches(token, normalized)),
    ) || null
  );
};

export const buildReasoningSettingsFromProfile = profile =>
  profile?.supports_reasoning
    ? {
        [LLM_MODEL_FIELDS.reasoning]: true,
        [LLM_MODEL_FIELDS.thinkingType]: profile.thinking_type ?? null,
        [LLM_MODEL_FIELDS.supportedEfforts]: [...(profile.supported_efforts || [])],
        [LLM_MODEL_FIELDS.defaultEffort]: profile.default_effort ?? null,
      }
    : {
        [LLM_MODEL_FIELDS.reasoning]: false,
        [LLM_MODEL_FIELDS.thinkingType]: null,
        [LLM_MODEL_FIELDS.supportedEfforts]: null,
        [LLM_MODEL_FIELDS.defaultEffort]: null,
      };

export const isLlmModelReasoningConfigured = settings =>
  settings?.[LLM_MODEL_FIELDS.thinkingType] != null ||
  Array.isArray(settings?.[LLM_MODEL_FIELDS.supportedEfforts]) ||
  settings?.[LLM_MODEL_FIELDS.defaultEffort] != null;

export const getLlmModelRecognition = (name, profile) => {
  if (!String(name ?? '').trim()) return null;
  if (!profile) {
    return { tone: LLM_MODEL_RECOGNITION_TONES.warning, text: LLM_MODEL_RECOGNITION_TEXTS.unrecognized };
  }
  return {
    tone: LLM_MODEL_RECOGNITION_TONES.success,
    text: profile.supports_reasoning
      ? LLM_MODEL_RECOGNITION_TEXTS.recognized(profile.label)
      : LLM_MODEL_RECOGNITION_TEXTS.recognizedWithoutReasoning(profile.label),
  };
};

export const getLlmModelReasoningDescription = profile => {
  if (!profile) return LLM_MODEL_REASONING_DESCRIPTIONS.default;
  if (!profile.supports_reasoning) return LLM_MODEL_REASONING_DESCRIPTIONS.unsupported;
  return LLM_MODEL_REASONING_DESCRIPTIONS[profile.lock_reason] || LLM_MODEL_REASONING_DESCRIPTIONS.recognized;
};

export const getEffortLevelLabel = level => LLM_MODEL_EFFORT_LEVEL_LABELS[level] || level;

// Levels the profile does not list are not offered, but a stored one stays visible so the admin
// can see it and uncheck it instead of having it dropped silently
export const getUnsupportedStoredLevels = (profile, storedEfforts) =>
  profile?.supports_reasoning
    ? (storedEfforts || []).filter(level => !profile.supported_efforts.includes(level))
    : [];

export const getEffortLevelOptions = (
  profile,
  effortLevels = LLM_MODEL_EFFORT_LEVELS,
  storedEfforts = [],
) => {
  const unsupported = getUnsupportedStoredLevels(profile, storedEfforts);
  const offered = profile?.supports_reasoning ? profile.supported_efforts : effortLevels;
  return effortLevels
    .filter(level => offered.includes(level) || unsupported.includes(level))
    .map(level => ({
      value: level,
      label: getEffortLevelLabel(level),
      unsupported: unsupported.includes(level),
    }));
};

export const getDefaultEffortOptions = supportedEfforts =>
  (supportedEfforts || [])
    .filter(level => level !== LLM_MODEL_EFFORT_NONE)
    .map(level => ({ value: level, label: getEffortLevelLabel(level) }));

export const toggleEffortLevel = (supportedEfforts, level, orderedLevels) => {
  const selected = new Set(supportedEfforts || []);
  if (selected.has(level)) selected.delete(level);
  else selected.add(level);
  return orderedLevels.filter(candidate => selected.has(candidate));
};

export const getRemovedEffortLevels = (initialEfforts, currentEfforts) =>
  (initialEfforts || []).filter(level => !(currentEfforts || []).includes(level));
