import { LOCKED_SKILL_VERSION_STATUSES } from '@/[fsd]/features/skill/lib/constants/skill.constants';
import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
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
