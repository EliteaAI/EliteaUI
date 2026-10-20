import { isPromptShown, syncPromptVariables, toCreateBody } from './scheduleForm.helpers';

const ENTRY_POINT = 'entry_point';
// Drafted fields copied as they are; the draft names the type `entity_type`, the form `type`
const PLAIN_FIELDS = ['name', 'description', 'cron', 'timezone', 'expires_at'];
const isFilled = value => value !== undefined && value !== null && value !== '';

export const toDraftRequest = (values, lockedEntity, timezone) => ({
  current: toCreateBody(values),
  locked_entity: lockedEntity ? { entity_type: lockedEntity.type, application_id: lockedEntity.id } : null,
  timezone,
});

export const draftToFormValues = (draft, values, lockedEntity) => {
  const next = { ...values };
  const typeChanged = !lockedEntity && isFilled(draft.entity_type) && draft.entity_type !== values.type;
  PLAIN_FIELDS.filter(field => isFilled(draft[field])).forEach(field => {
    next[field] = draft[field];
  });

  if (lockedEntity) {
    // The drafted version counts only when it belongs to the locked entity
    if (isFilled(draft.version_id) && draft.application_id === lockedEntity.id)
      next.version_id = draft.version_id;
  } else {
    const entityChanged = isFilled(draft.application_id) && draft.application_id !== values.application_id;
    if (typeChanged || entityChanged) Object.assign(next, { application_id: '', version_id: '' });
    if (isFilled(draft.entity_type)) next.type = draft.entity_type;
    if (isFilled(draft.application_id)) next.application_id = draft.application_id;
    if (isFilled(draft.version_id)) next.version_id = draft.version_id;
  }

  // A pipeline the draft switches to without a run mode starts at Entry point
  const keptMode = typeChanged ? undefined : values.run_mode;
  next.run_mode = next.type === 'agent' ? null : (draft.run_mode ?? keptMode ?? ENTRY_POINT);
  const showsPrompt = isPromptShown(next);
  next.prompt = showsPrompt ? (draft.prompt ?? values.prompt ?? '') : '';
  next.variables = showsPrompt ? syncPromptVariables(next.prompt, draft.variables ?? values.variables) : [];
  return next;
};

export const changedFields = (values, draft, lockedEntity) => {
  const drafted = draftToFormValues(draft, values, lockedEntity);
  return Object.keys(drafted)
    .filter(field => JSON.stringify(drafted[field]) !== JSON.stringify(values[field]))
    .map(field => ({ field, current: values[field], drafted: drafted[field] }));
};

export const isScheduleFormEmpty = ({ name, prompt, application_id }) => !name && !prompt && !application_id;
