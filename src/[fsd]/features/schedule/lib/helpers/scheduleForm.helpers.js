import * as Yup from 'yup';

import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';
import { contextResolver } from '@/common/utils';

const ENTITY_TYPES = ['agent', 'pipeline'];
const ENTRY_POINT = 'entry_point';
const DEFAULT_RETURN_TO = '/schedules';

const defaultRunMode = type => (type === 'pipeline' ? ENTRY_POINT : null);

export const isPromptShown = ({ type, run_mode }) => type === 'agent' || run_mode === 'prompt';

export const scheduleFormSchema = Yup.object({
  description: Yup.string().max(MAX_DESCRIPTION_LENGTH),
}).test('prompt-required', 'Prompt is required', function (values) {
  return !isPromptShown(values) || !!values.prompt?.trim() || this.createError({ path: 'prompt' });
});

export const resetWhatToRun = (values, type) => ({
  ...values,
  type,
  application_id: '',
  version_id: '',
  run_mode: defaultRunMode(type),
  prompt: '',
  variables: [],
});

export const syncPromptVariables = (prompt, variables = []) => {
  const valueByName = Object.fromEntries(variables.map(({ name, value }) => [name, value]));
  return contextResolver(prompt).map(name => ({ name, value: valueByName[name] ?? '' }));
};

export const buildInitialValues = (searchParams, locationState) => {
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const urlEntity = ENTITY_TYPES.includes(entityType) && entityId ? { type: entityType, id: entityId } : null;
  const type = urlEntity?.type ?? 'agent';

  return {
    values: {
      ...resetWhatToRun({ name: '', description: '' }, type),
      application_id: urlEntity?.id ?? '',
    },
    urlEntity,
    returnTo: locationState?.returnTo ?? DEFAULT_RETURN_TO,
  };
};

export const getEntityLock = (urlEntity, entity) => {
  if (!urlEntity) return { locked: false, unavailable: false };
  const locked = entity?.type === urlEntity.type;
  return { locked, unavailable: !locked };
};

export const toCreateBody = ({ type, description, run_mode, prompt, variables, ...rest }) => {
  const mode = type === 'agent' ? null : run_mode;
  const sendsPrompt = isPromptShown({ type, run_mode: mode });
  const { name, application_id, version_id, cron, timezone, expires_at } = rest;

  return {
    name,
    description: description || null,
    entity_type: type,
    application_id,
    version_id,
    run_mode: mode,
    prompt: sendsPrompt ? prompt : null,
    variables: sendsPrompt ? variables : [],
    cron,
    timezone,
    expires_at,
  };
};

export const toFieldErrors = error => {
  const issues = error?.data?.error;
  if (!Array.isArray(issues)) return {};
  return issues.reduce((errors, { loc, msg }) => {
    const field = loc?.[0];
    return field && !(field in errors) ? { ...errors, [field]: msg } : errors;
  }, {});
};
