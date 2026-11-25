import { API_PROTOCOLS } from '../constants/apiProtocol.constants.js';
import {
  LLM_MODEL_EFFORT_LEVELS,
  LLM_MODEL_EFFORT_LEVEL_LABELS,
  LLM_MODEL_EFFORT_NONE,
  LLM_MODEL_FIELDS,
  LLM_MODEL_REASONING_DESCRIPTIONS,
  LLM_MODEL_REASONING_FIELDS,
  LLM_MODEL_RECOGNITION_TEXTS,
  LLM_MODEL_STATUS_TONES,
  LLM_MODEL_THINKING_TYPES,
} from '../constants/llmModelForm.constants.js';
import { isApiProtocolCredentialType } from './apiProtocol.helpers.js';

const AZURE_REASONING_WARNED_PROVIDERS = ['openai', 'azure', 'anthropic'];
const THINKING_TYPES_WITHOUT_OFF_PATH = [
  LLM_MODEL_THINKING_TYPES.adaptive,
  LLM_MODEL_THINKING_TYPES.alwaysOn,
];
const EFFORTS_CLAUDE_THINKING_REJECTS = [LLM_MODEL_EFFORT_NONE, 'minimal'];

const ownValue = (record, key) => (record && Object.hasOwn(record, key) ? record[key] : undefined);

const getCatalogPrefix = (prefixes, credentialType, apiProtocol) =>
  ownValue(
    prefixes,
    isApiProtocolCredentialType(credentialType) ? `${credentialType}:${apiProtocol}` : credentialType,
  );

export const findLlmModelCatalogEntry = ({ catalog, name, credentialType, apiProtocol }) => {
  if (!name) return null;
  const prefix = getCatalogPrefix(catalog?.prefixes, credentialType, apiProtocol);
  const key = [prefix && `${prefix}/${name}`, name].find(
    candidate => candidate && ownValue(catalog?.models, candidate),
  );
  return key ? { ...catalog.models[key], key } : null;
};

const REASONING_OFF_SETTINGS = {
  [LLM_MODEL_FIELDS.reasoning]: false,
  [LLM_MODEL_FIELDS.thinkingType]: null,
  [LLM_MODEL_FIELDS.supportedEfforts]: null,
  [LLM_MODEL_FIELDS.defaultEffort]: null,
};

export const buildReasoningSettingsFromCatalogEntry = entry =>
  (entry?.supports_reasoning ?? Boolean(entry?.supported_efforts))
    ? {
        [LLM_MODEL_FIELDS.reasoning]: true,
        [LLM_MODEL_FIELDS.thinkingType]: entry.thinking_type ?? null,
        [LLM_MODEL_FIELDS.supportedEfforts]: entry.supported_efforts ? [...entry.supported_efforts] : null,
        [LLM_MODEL_FIELDS.defaultEffort]: entry.default_effort ?? null,
      }
    : REASONING_OFF_SETTINGS;

const isReasoningReported = entry =>
  typeof entry.supports_reasoning === 'boolean' || Boolean(entry.supported_efforts);

export const buildPrefillFromCatalogEntry = (entry, { isVisionIncluded, isUnreportedReasoningKept }) => ({
  ...(isUnreportedReasoningKept && !isReasoningReported(entry)
    ? {}
    : buildReasoningSettingsFromCatalogEntry(entry)),
  ...(isVisionIncluded && typeof entry.supports_vision === 'boolean'
    ? { [LLM_MODEL_FIELDS.vision]: entry.supports_vision }
    : {}),
});

export const pickPrefillableSettings = (settings, isVisionIncluded) =>
  Object.fromEntries(
    [...LLM_MODEL_REASONING_FIELDS, ...(isVisionIncluded ? [LLM_MODEL_FIELDS.vision] : [])].map(field => [
      field,
      settings?.[field] ?? null,
    ]),
  );

export const areSettingsAsPrefilled = (settings, prefill) =>
  Boolean(prefill) &&
  Object.entries(prefill).every(
    ([field, value]) => JSON.stringify(settings?.[field] ?? null) === JSON.stringify(value ?? null),
  );

export const isLlmModelReasoningConfigured = settings =>
  settings?.[LLM_MODEL_FIELDS.thinkingType] != null ||
  Array.isArray(settings?.[LLM_MODEL_FIELDS.supportedEfforts]) ||
  settings?.[LLM_MODEL_FIELDS.defaultEffort] != null;

export const getLlmModelRecognition = (name, entry) => {
  if (!String(name ?? '').trim()) return null;
  return entry
    ? { tone: LLM_MODEL_STATUS_TONES.success, text: LLM_MODEL_RECOGNITION_TEXTS.recognized }
    : { tone: LLM_MODEL_STATUS_TONES.warning, text: LLM_MODEL_RECOGNITION_TEXTS.unrecognized };
};

// Gemini reasons fine on DIAL's azure route; OpenAI models and Claude thinking need another protocol
export const isAzureReasoningWarned = ({ isApiProtocolShown, apiProtocol, supportsReasoning, entry }) =>
  Boolean(
    isApiProtocolShown &&
    apiProtocol === API_PROTOCOLS.azure &&
    supportsReasoning &&
    (AZURE_REASONING_WARNED_PROVIDERS.includes(entry?.provider) || entry?.thinking_type),
  );

export const getLlmModelReasoningDescription = entry => {
  if (!entry) return LLM_MODEL_REASONING_DESCRIPTIONS.default;
  if (entry.supports_reasoning === false) return LLM_MODEL_REASONING_DESCRIPTIONS.unsupported;
  if (entry.reasoning_locked) return LLM_MODEL_REASONING_DESCRIPTIONS.locked;
  return entry.supports_reasoning
    ? LLM_MODEL_REASONING_DESCRIPTIONS.recognized
    : LLM_MODEL_REASONING_DESCRIPTIONS.default;
};

export const getEffortLevelLabel = level => LLM_MODEL_EFFORT_LEVEL_LABELS[level] || level;

const getOfferedEffortLevels = (entry, thinkingType) =>
  (entry?.supported_efforts || LLM_MODEL_EFFORT_LEVELS).filter(
    level =>
      !THINKING_TYPES_WITHOUT_OFF_PATH.includes(thinkingType) ||
      !EFFORTS_CLAUDE_THINKING_REJECTS.includes(level),
  );

export const getUnsupportedStoredLevels = (entry, storedEfforts, thinkingType) => {
  const offered = getOfferedEffortLevels(entry, thinkingType);
  return (storedEfforts || []).filter(level => !offered.includes(level));
};

export const getEffortLevelOptions = (entry, storedEfforts = [], thinkingType = null) => {
  const unsupported = getUnsupportedStoredLevels(entry, storedEfforts, thinkingType);
  const offered = getOfferedEffortLevels(entry, thinkingType);
  return LLM_MODEL_EFFORT_LEVELS.filter(level => offered.includes(level) || unsupported.includes(level)).map(
    level => ({
      value: level,
      label: getEffortLevelLabel(level),
      unsupported: unsupported.includes(level),
    }),
  );
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
