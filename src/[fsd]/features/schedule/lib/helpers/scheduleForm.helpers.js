import * as Yup from 'yup';

import { TOOLKIT_INDEX_TYPE, TRIGGER_KIND, getListRoute } from '@/[fsd]/entities/schedule';
import { APPROVAL_RULE, DEFAULT_APPROVAL_RULE } from '@/[fsd]/entities/schedule/lib/constants';
import { WebhookConstants } from '@/[fsd]/shared/lib/constants';
import { ScheduleHelpers, WebhookHelpers } from '@/[fsd]/shared/lib/helpers';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';
import { contextResolver } from '@/common/utils';

import { UNKNOWN_WARNING_LABEL, WAIT_FOR_OWNER_CODES, WARNING_LABELS } from '../constants';

const { GITLAB_AUTH_METHODS, WEBHOOK_TYPES } = WebhookConstants;

const ENTITY_TYPES = ['agent', 'pipeline'];
const APPLICATION_TYPES = ENTITY_TYPES;
const ENTRY_POINT = 'entry_point';
// An in-app path: one leading slash, so `//host` and `https://host` never pass
const IN_APP_PATH = /^\/(?!\/)/;

export const DEFAULT_SCHEDULE_CRON = '0 0 * * 6';

const defaultRunMode = type => (type === 'pipeline' ? ENTRY_POINT : null);

// A toolkit index runs with its saved settings: no version, no starting input, no prompt
export const isIndexType = type => type === TOOLKIT_INDEX_TYPE;

export const isPromptShown = ({ type, run_mode }) =>
  !isIndexType(type) && (type === 'agent' || run_mode === 'prompt');

const requiredForApplication = message => schema =>
  schema.when('type', { is: isIndexType, then: s => s.notRequired(), otherwise: s => s.required(message) });
const requiredForIndex = message => schema =>
  schema.when('type', { is: isIndexType, then: s => s.required(message), otherwise: s => s.notRequired() });

export const scheduleFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  description: Yup.string().max(MAX_DESCRIPTION_LENGTH),
  application_id: requiredForApplication('Choose an agent or a pipeline')(Yup.string()),
  version_id: requiredForApplication('Choose a version')(Yup.string()),
  toolkit_id: requiredForIndex('Choose a toolkit')(Yup.string()),
  index_name: requiredForIndex('Choose an index')(Yup.string()),
})
  // A toolkit index runs at most once a day; the cron field of SCHEDULE SETTINGS shows the same message
  .test('index-daily-floor', '', function (values) {
    if (!isIndexType(values.type) || values.trigger_kind === TRIGGER_KIND.webhook) return true;
    const { isValid, message } = ScheduleHelpers.validateCronExpression(values.cron);
    return isValid || this.createError({ path: 'cron', message });
  })
  .test('prompt-required', 'Prompt is required', function (values) {
    return !isPromptShown(values) || !!values.prompt?.trim() || this.createError({ path: 'prompt' });
  })
  // Only a new GitLab signing-token webhook carries the pasted token
  .test('signing-token', '', function (values) {
    if (values.gitlab_auth_method !== GITLAB_AUTH_METHODS.signing_token || values.id) return true;
    const message = WebhookHelpers.getGitlabSigningTokenError(values.signing_secret_value);
    return !message || this.createError({ path: 'signing_secret_value', message });
  });

export const isWebhookForm = values => values.trigger_kind === TRIGGER_KIND.webhook;

// The trigger part of a new form: cron timing for a schedule, the sender for a webhook
const triggerValues = kind =>
  kind === TRIGGER_KIND.webhook
    ? {
        trigger_kind: TRIGGER_KIND.webhook,
        webhook_type: WEBHOOK_TYPES.github,
        gitlab_auth_method: null,
        signing_secret_value: '',
      }
    : {
        cron: DEFAULT_SCHEDULE_CRON,
        timezone: ScheduleHelpers.getBrowserTimezone(),
        expires_at: null,
      };

export const resetWhatToRun = (values, type) => ({
  ...values,
  type,
  application_id: '',
  version_id: '',
  toolkit_id: '',
  index_name: '',
  run_mode: defaultRunMode(type),
  prompt: '',
  variables: [],
});

export const syncPromptVariables = (prompt, variables = []) => {
  const valueByName = Object.fromEntries(variables.map(({ name, value }) => [name, value]));
  // A pipeline schedule in entry point mode stores no prompt (null)
  return contextResolver(prompt ?? '').map(name => ({ name, value: valueByName[name] ?? '' }));
};

// entityRoute: the entity and the editor path of a form nested in an agent or pipeline editor
export const buildInitialValues = (
  searchParams,
  locationState,
  entityRoute = {},
  kind = TRIGGER_KIND.cron,
) => {
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  const urlEntity =
    entityRoute.lockedEntity ??
    // Numeric, as the entity options are: a string id would leave the locked field empty
    (APPLICATION_TYPES.includes(entityType) && entityId ? { type: entityType, id: Number(entityId) } : null);
  const type = urlEntity?.type ?? 'agent';
  const returnTo = locationState?.returnTo;

  return {
    values: {
      ...resetWhatToRun({ name: '', description: '' }, type),
      ...(isIndexType(type)
        ? { toolkit_id: urlEntity.id, index_name: urlEntity.indexName }
        : { application_id: urlEntity?.id ?? '' }),
      ...triggerValues(kind),
      approval_rule: DEFAULT_APPROVAL_RULE,
      enabled: true,
    },
    urlEntity,
    returnTo: IN_APP_PATH.test(returnTo) ? returnTo : (entityRoute.returnTo ?? getListRoute(kind)),
  };
};

// The saved end-of-day moment, read as a calendar date in the schedule's own time zone
const toExpiryDate = (expiresAt, timeZone) =>
  expiresAt ? new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(expiresAt)) : null;

// The saved cron stays in the schedule's own zone: only a cron edit moves it to the browser zone
export const buildEditValues = (schedule, locationState, entityRoute) => {
  const kind = schedule.trigger_kind ?? TRIGGER_KIND.cron;
  const { values, returnTo } = buildInitialValues(new URLSearchParams(), locationState, entityRoute, kind);
  const trigger =
    kind === TRIGGER_KIND.webhook
      ? {
          id: schedule.id,
          webhook_type: schedule.webhook_type,
          gitlab_auth_method: schedule.gitlab_auth_method ?? null,
        }
      : {
          cron: schedule.cron,
          timezone: schedule.timezone || values.timezone,
          expires_at: toExpiryDate(schedule.expires_at, schedule.timezone),
        };

  return {
    values: {
      ...values,
      name: schedule.name,
      description: schedule.description ?? '',
      type: schedule.entity_type,
      ...(isIndexType(schedule.entity_type)
        ? { toolkit_id: schedule.toolkit_id, index_name: schedule.index_name }
        : { application_id: schedule.application_id, version_id: schedule.version_id }),
      run_mode: schedule.run_mode,
      prompt: schedule.prompt ?? '',
      variables: syncPromptVariables(schedule.prompt, schedule.variables),
      ...trigger,
      // The saved rule, so a confirmed schedule keeps its consent and is not saved back as Pause and ask
      approval_rule: schedule.approval_rule ?? DEFAULT_APPROVAL_RULE,
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
  toolkit_id,
  index_name,
  run_mode,
  prompt,
  variables,
  cron,
  timezone,
  expires_at,
  approval_rule = DEFAULT_APPROVAL_RULE,
  enabled,
  trigger_kind,
  webhook_type,
  gitlab_auth_method,
  signing_secret_value,
}) => {
  const mode = type === 'agent' ? null : run_mode;
  const sendsPrompt = isPromptShown({ type, run_mode: mode });
  // The server refuses version, run mode, prompt and variables on a toolkit index
  const target = isIndexType(type)
    ? { toolkit_id, index_name }
    : {
        application_id,
        version_id,
        run_mode: mode,
        prompt: sendsPrompt ? prompt : null,
        variables: sendsPrompt ? variables : [],
      };

  return {
    name,
    description: description || null,
    entity_type: type,
    ...target,
    // The server refuses cron fields on a webhook and webhook fields on a schedule
    ...(trigger_kind === TRIGGER_KIND.webhook
      ? {
          trigger_kind,
          webhook_type,
          gitlab_auth_method: webhook_type === WEBHOOK_TYPES.gitlab ? gitlab_auth_method : null,
          ...(gitlab_auth_method === GITLAB_AUTH_METHODS.signing_token &&
            webhook_type === WEBHOOK_TYPES.gitlab && { signing_secret_value: signing_secret_value?.trim() }),
        }
      : { cron, timezone, expires_at }),
    // The server refuses a non-default rule on an index and the form hides the field for it
    approval_rule: isIndexType(type) ? DEFAULT_APPROVAL_RULE : approval_rule,
    // set on a new schedule only; a saved one pauses and resumes through its own calls
    ...(enabled !== undefined && { enabled }),
  };
};

// The PUT body has no `enabled`: a saved schedule pauses and resumes through its own calls
// A webhook keeps its sender: the PUT body has no trigger fields
export const toUpdateBody = values => {
  const body = toCreateBody(values);
  delete body.enabled;
  ['trigger_kind', 'webhook_type', 'gitlab_auth_method', 'signing_secret_value'].forEach(
    key => delete body[key],
  );
  return body;
};

// The schedule API answers one broken field at a time: { error, field }; a message without a field goes to the banner
export const toFieldErrors = error => {
  const { error: message, field } = error?.data ?? {};
  return field && typeof message === 'string' ? { [field]: message } : {};
};

// Warning shape: { code, message, step | toolkit | tool }; sensitive_action names the toolkit and the tool
export const toWarningItems = (warnings = []) =>
  warnings.map(({ code, message, step, toolkit, tool }) => ({
    label: WARNING_LABELS[code] ?? UNKNOWN_WARNING_LABEL,
    text: message,
    target: step ?? (tool && toolkit ? `${toolkit} / ${tool}` : (toolkit ?? tool)),
  }));

// One group per blocking code, in the order the server sends them: the form shows one box per cause kind
export const toRiskItems = (blocking = []) => {
  const groups = new Map();
  blocking.forEach(finding => {
    if (!groups.has(finding.code)) groups.set(finding.code, { code: finding.code, findings: [] });
    groups.get(finding.code).findings.push(finding);
  });
  return [...groups.values()];
};

// Splits the risk answer by the approval rule. Under "Pause and ask me" a missing credential or a personal
// sign-in does not stop the save: the run waits for the owner, so these findings move to `waiting`.
// A webhook never waits for a sign-in (#7401), so for it they always block.
export const splitRiskFindings = (result, approvalRule, isWebhook = false) => {
  const blocking = result?.blocking ?? [];
  if (isWebhook || approvalRule !== APPROVAL_RULE.PAUSE_AND_ASK) return { blocking, waiting: [] };
  const waitsForOwner = finding => WAIT_FOR_OWNER_CODES.includes(finding.code);
  return {
    blocking: blocking.filter(finding => !waitsForOwner(finding)),
    waiting: [...blocking, ...(result?.warnings ?? [])].filter(waitsForOwner),
  };
};
