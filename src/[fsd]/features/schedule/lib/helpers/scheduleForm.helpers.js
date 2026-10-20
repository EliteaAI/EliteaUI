import * as Yup from 'yup';

import { ScheduleHelpers } from '@/[fsd]/shared/lib/helpers';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';
import { contextResolver } from '@/common/utils';
import RouteDefinitions from '@/routes';

const ENTITY_TYPES = ['agent', 'pipeline'];
const ENTRY_POINT = 'entry_point';
// An in-app path: one leading slash, so `//host` and `https://host` never pass
const IN_APP_PATH = /^\/(?!\/)/;

export const DEFAULT_SCHEDULE_CRON = '0 0 * * 6';

const defaultRunMode = type => (type === 'pipeline' ? ENTRY_POINT : null);

export const isPromptShown = ({ type, run_mode }) => type === 'agent' || run_mode === 'prompt';

export const scheduleFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  description: Yup.string().max(MAX_DESCRIPTION_LENGTH),
  application_id: Yup.string().required('Choose an agent or a pipeline'),
  version_id: Yup.string().required('Choose a version'),
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
  const returnTo = locationState?.returnTo;

  return {
    values: {
      ...resetWhatToRun({ name: '', description: '' }, type),
      application_id: urlEntity?.id ?? '',
      cron: DEFAULT_SCHEDULE_CRON,
      timezone: ScheduleHelpers.getBrowserTimezone(),
      expires_at: null,
    },
    urlEntity,
    returnTo: IN_APP_PATH.test(returnTo) ? returnTo : RouteDefinitions.Schedules,
  };
};

// The saved end-of-day moment, read as a calendar date in the schedule's own time zone
const toExpiryDate = (expiresAt, timeZone) =>
  expiresAt ? new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(expiresAt)) : null;

// The saved cron stays in the schedule's own zone: only a cron edit moves it to the browser zone
export const buildEditValues = (schedule, locationState) => {
  const { values, returnTo } = buildInitialValues(new URLSearchParams(), locationState);

  return {
    values: {
      ...values,
      name: schedule.name,
      description: schedule.description ?? '',
      type: schedule.entity_type,
      application_id: schedule.application_id,
      version_id: schedule.version_id,
      run_mode: schedule.run_mode,
      prompt: schedule.prompt ?? '',
      variables: syncPromptVariables(schedule.prompt, schedule.variables),
      cron: schedule.cron,
      timezone: schedule.timezone || values.timezone,
      expires_at: toExpiryDate(schedule.expires_at, schedule.timezone),
    },
    returnTo,
  };
};

export const getEntityLock = (urlEntity, entity) => {
  if (!urlEntity) return { locked: false, unavailable: false };
  const locked = entity?.type === urlEntity.type;
  return { locked, unavailable: !locked };
};

export const toCreateBody = ({
  name,
  description,
  type,
  application_id,
  version_id,
  run_mode,
  prompt,
  variables,
  cron,
  timezone,
  expires_at,
}) => {
  const mode = type === 'agent' ? null : run_mode;
  const sendsPrompt = isPromptShown({ type, run_mode: mode });

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

export const toUpdateBody = toCreateBody;

// The schedule API answers one broken field at a time: { error, field }; a message without a field goes to the banner
export const toFieldErrors = error => {
  const { error: message, field } = error?.data ?? {};
  return field && typeof message === 'string' ? { [field]: message } : {};
};
