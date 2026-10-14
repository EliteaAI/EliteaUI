import { LOCKED_SKILL_VERSION_STATUSES } from '@/[fsd]/features/skill/lib/constants/skill.constants';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { autoModel, isAutoSelection, selectionFields } from '@/[fsd]/shared/lib/utils/autoRouting.utils';
import {
  defaultReasoningEffortFor,
  generateLLMSettings,
  modelSupportsReasoning,
} from '@/[fsd]/shared/lib/utils/llmSettings.utils';

const isSet = value => value !== null && value !== undefined;

export const toRunSettingsPayload = runSettings => {
  if (!runSettings) return null;
  const llmSettings = Object.fromEntries(
    Object.entries(runSettings.llm_settings || {}).filter(([, value]) => isSet(value)),
  );
  return {
    ignore_project_context: Boolean(runSettings.ignore_project_context),
    ...(Object.keys(llmSettings).length ? { llm_settings: llmSettings } : {}),
  };
};

export const findSkillSavedModel = (models, llmSettings) => {
  if (isAutoSelection(llmSettings)) return autoModel(llmSettings.selection.profile_ref);
  const name = llmSettings?.model_name;
  if (!name) return null;
  return (
    models.find(model => model.name === name && model.project_id === llmSettings.model_project_id) ||
    models.find(model => model.name === name) || { name, project_id: llmSettings.model_project_id }
  );
};

export const findListedModel = (models, model) =>
  model
    ? models.find(listed => listed.name === model.name && listed.project_id === model.project_id) || null
    : null;

const choosesModel = llmSettings => !!llmSettings?.model_name || isAutoSelection(llmSettings);

export const withDefaultSkillModel = (runSettings, defaultModel) =>
  choosesModel(runSettings?.llm_settings) || !defaultModel
    ? runSettings
    : {
        ...runSettings,
        llm_settings: generateLLMSettings(defaultModel, runSettings?.llm_settings || {}, {
          includeModelInfo: true,
        }),
      };

export const hasSkillChatModelOverride = entitySettings => choosesModel(entitySettings?.llm_settings);

export const withPinnedSkillVersion = (skill, versionId) =>
  !skill || skill.entity_settings?.version_id || !versionId
    ? skill
    : { ...skill, entity_settings: { ...skill.entity_settings, version_id: versionId } };

export const withoutSkillChatModel = skill => ({
  ...skill,
  entity_settings: { ...skill.entity_settings, llm_settings: undefined },
});

export const resolveSkillChatLLMSettings = (entitySettings, versionDetails) =>
  hasSkillChatModelOverride(entitySettings)
    ? entitySettings.llm_settings
    : versionDetails?.run_settings?.llm_settings || {};

export const isSkillChatModelPending = (entitySettings, pinnedVersionDetails) =>
  !hasSkillChatModelOverride(entitySettings) && !pinnedVersionDetails;

export const resolveSkillChatModel = (models, llmSettings) =>
  findSkillSavedModel(models, llmSettings) || models.find(model => model.default) || models[0] || null;

export const withRunSettings = (versionUpdate, runSettings) => {
  const payload = toRunSettingsPayload(runSettings);
  return payload ? { ...versionUpdate, run_settings: payload } : versionUpdate;
};

export const includesProjectContext = runSettings => !runSettings?.ignore_project_context;

export const isSkillVersionLocked = status => LOCKED_SKILL_VERSION_STATUSES.includes(status);

export const testPanelSettingsFor = (savedLlmSettings, model) => ({
  max_tokens: savedLlmSettings?.max_tokens ?? DEFAULT_MAX_TOKENS,
  ...(modelSupportsReasoning(model)
    ? {
        temperature: null,
        reasoning_effort: savedLlmSettings?.reasoning_effort ?? defaultReasoningEffortFor(model),
      }
    : { temperature: savedLlmSettings?.temperature ?? DEFAULT_TEMPERATURE, reasoning_effort: null }),
});

const testPanelSelectionFor = (model, savedLlmSettings) =>
  isAutoSelection(model) && isAutoSelection(savedLlmSettings)
    ? selectionFields({ selection: savedLlmSettings.selection })
    : selectionFields(model);

export const testPanelRequestSettings = (model, llmSettings, savedLlmSettings) => ({
  temperature: llmSettings.temperature ?? null,
  max_tokens: llmSettings.max_tokens ?? DEFAULT_MAX_TOKENS,
  reasoning_effort: llmSettings.reasoning_effort ?? null,
  ...testPanelSelectionFor(model, savedLlmSettings),
});

const sortEntriesByKey = record =>
  Object.entries(record || {}).sort(([left], [right]) => left.localeCompare(right));

const buildVersionModelSignature = values =>
  JSON.stringify(sortEntriesByKey(toRunSettingsPayload(values?.version_details?.run_settings)?.llm_settings));

export const hasVersionModelChanged = (values, initialValues) =>
  buildVersionModelSignature(values) !== buildVersionModelSignature(initialValues);

export const hasUnsavedRunChanges = (values, initialValues) =>
  (values?.version_details?.instructions ?? '') !== (initialValues?.version_details?.instructions ?? '') ||
  includesProjectContext(values?.version_details?.run_settings) !==
    includesProjectContext(initialValues?.version_details?.run_settings);
