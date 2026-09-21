import { AutoRoutingConstants } from '@/[fsd]/shared/lib/constants';

const {
  AUTO_MODEL_ID,
  AUTO_MODEL_LABEL,
  AUTO_DEFAULT_VALUE,
  AUTO_SELECTION_MODE,
  AUTO_SCOPE_MODE,
  AUTO_REASONING_MODE,
  MODEL_SURFACES,
} = AutoRoutingConstants;

export const isAutoSelection = settings => settings?.selection?.mode === AUTO_SELECTION_MODE;

// Auto is a picker intent, not a provider model with a known output limit.
export const autoModel = profile => ({
  id: AUTO_MODEL_ID,
  name: AUTO_MODEL_ID,
  display_name: AUTO_MODEL_LABEL,
  selection: {
    mode: AUTO_SELECTION_MODE,
    profile_ref: profile,
    scope_mode: AUTO_SCOPE_MODE,
    reasoning: { mode: AUTO_REASONING_MODE.auto },
  },
});

export const resolveModelSurface = (
  primaryAgentType,
  fallbackAgentType,
  defaultSurface = MODEL_SURFACES.chat,
) =>
  (primaryAgentType || fallbackAgentType) === MODEL_SURFACES.pipeline
    ? MODEL_SURFACES.pipeline
    : defaultSurface;

export const modelsWithAuto = (models, availability, surface) =>
  availability?.enabled === true && [MODEL_SURFACES.chat, MODEL_SURFACES.agent].includes(surface)
    ? [autoModel(availability.profile_ref), ...models]
    : models;

// Only eligible creation surfaces opt into the project default intent. The
// catalog's existing default flag remains concrete for Pipelines/internal tools.
export const defaultModelForSurface = (data, surface) =>
  data?.auto_routing?.enabled === true &&
  data?.default_selection?.mode === AUTO_SELECTION_MODE &&
  [MODEL_SURFACES.chat, MODEL_SURFACES.agent].includes(surface)
    ? autoModel(data.default_selection.profile_ref)
    : data?.items?.find(model => model.default) || data?.items?.[0] || null;

export const defaultModelRequest = (section, value) => {
  if (section === 'llm' && value === AUTO_DEFAULT_VALUE) return { section, mode: AUTO_SELECTION_MODE };
  const [name, projectId] = value.split('<<>>');
  return { section, name, target_project_id: +projectId };
};

export const selectionFields = model =>
  isAutoSelection(model)
    ? {
        selection: model.selection,
        model_name: null,
        model_project_id: null,
        temperature: null,
        reasoning_effort: null,
      }
    : { selection: null, model_name: model?.name, model_project_id: model?.project_id };
