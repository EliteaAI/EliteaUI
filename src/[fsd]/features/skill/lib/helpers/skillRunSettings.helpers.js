import { LOCKED_SKILL_VERSION_STATUSES } from '@/[fsd]/features/skill/lib/constants/skill.constants';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { autoModel, isAutoSelection } from '@/[fsd]/shared/lib/utils/autoRouting.utils';
import {
  defaultReasoningEffortFor,
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

const choosesModel = llmSettings => !!llmSettings?.model_name || isAutoSelection(llmSettings);

export const resolveSkillChatLLMSettings = (entitySettings, versionDetails) =>
  choosesModel(entitySettings?.llm_settings)
    ? entitySettings.llm_settings
    : versionDetails?.run_settings?.llm_settings || {};

export const isSkillChatModelPending = (entitySettings, pinnedVersionDetails) =>
  !choosesModel(entitySettings?.llm_settings) && !pinnedVersionDetails;

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

const sortEntriesByKey = record =>
  Object.entries(record || {}).sort(([left], [right]) => left.localeCompare(right));

const buildRunSettingsSignature = runSettings => {
  const { ignore_project_context = false, llm_settings } = toRunSettingsPayload(runSettings) || {};
  return JSON.stringify([ignore_project_context, sortEntriesByKey(llm_settings)]);
};

export const hasUnsavedRunChanges = (values, initialValues) =>
  (values?.version_details?.instructions ?? '') !== (initialValues?.version_details?.instructions ?? '') ||
  buildRunSettingsSignature(values?.version_details?.run_settings) !==
    buildRunSettingsSignature(initialValues?.version_details?.run_settings);
