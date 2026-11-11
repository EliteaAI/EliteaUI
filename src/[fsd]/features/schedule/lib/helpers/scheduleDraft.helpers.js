import { isIndexType, isPromptShown, syncPromptVariables, toCreateBody } from './scheduleForm.helpers';

const ENTRY_POINT = 'entry_point';
// Drafted fields copied as they are; the draft names the type `entity_type`, the form `type`
const PLAIN_FIELDS = ['name', 'description', 'cron', 'timezone', 'expires_at'];
const isFilled = value => value !== undefined && value !== null && value !== '';
// Ids come as numbers from the API and as strings from the URL
const sameId = (a, b) => String(a) === String(b);
const APPLICATION_TARGET = { application_id: '', version_id: '' };
const INDEX_TARGET = { toolkit_id: '', index_name: '' };

// Deep compare of form values: plain objects ignore key order, arrays keep item order
const isStructurallyEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every(key => Object.hasOwn(b, key) && isStructurallyEqual(a[key], b[key]))
  );
};

// The form keeps '' for an unchosen toolkit; the draft request takes null
const toCurrent = values => {
  const current = toCreateBody(values);
  return current.toolkit_id === '' ? { ...current, toolkit_id: null } : current;
};

const toLockedEntity = lockedEntity => {
  if (!lockedEntity) return null;
  return isIndexType(lockedEntity.type)
    ? { entity_type: lockedEntity.type, toolkit_id: lockedEntity.id, index_name: lockedEntity.indexName }
    : { entity_type: lockedEntity.type, application_id: lockedEntity.id };
};

export const toDraftRequest = (values, lockedEntity, timezone) => ({
  current: toCurrent(values),
  locked_entity: toLockedEntity(lockedEntity),
  timezone,
});

// The drafted target of an unlocked form: a changed type or entity clears the old one first
const applyDraftTarget = (next, draft, values, typeChanged) => {
  if (isIndexType(isFilled(draft.entity_type) ? draft.entity_type : values.type)) {
    const toolkitChanged = isFilled(draft.toolkit_id) && !sameId(draft.toolkit_id, values.toolkit_id);
    if (typeChanged || toolkitChanged) Object.assign(next, APPLICATION_TARGET, INDEX_TARGET);
    if (isFilled(draft.toolkit_id)) next.toolkit_id = draft.toolkit_id;
    if (isFilled(draft.index_name)) next.index_name = draft.index_name;
  } else {
    const entityChanged =
      isFilled(draft.application_id) && !sameId(draft.application_id, values.application_id);
    if (typeChanged || entityChanged) Object.assign(next, APPLICATION_TARGET);
    if (typeChanged && isIndexType(values.type)) Object.assign(next, INDEX_TARGET);
    if (isFilled(draft.application_id)) next.application_id = draft.application_id;
    if (isFilled(draft.version_id)) next.version_id = draft.version_id;
  }
  if (isFilled(draft.entity_type)) next.type = draft.entity_type;
};

export const draftToFormValues = (draft, values, lockedEntity) => {
  const next = { ...values };
  const typeChanged = !lockedEntity && isFilled(draft.entity_type) && draft.entity_type !== values.type;
  PLAIN_FIELDS.filter(field => isFilled(draft[field])).forEach(field => {
    next[field] = draft[field];
  });

  if (!lockedEntity) {
    applyDraftTarget(next, draft, values, typeChanged);
  } else if (
    !isIndexType(lockedEntity.type) &&
    // The drafted version counts only when it belongs to the locked entity
    isFilled(draft.version_id) &&
    sameId(draft.application_id, lockedEntity.id)
  ) {
    next.version_id = draft.version_id;
  }

  // A pipeline the draft switches to without a run mode starts at Entry point; agent and index have none
  const keptMode = typeChanged ? undefined : values.run_mode;
  next.run_mode =
    next.type === 'agent' || isIndexType(next.type) ? null : (draft.run_mode ?? keptMode ?? ENTRY_POINT);
  const showsPrompt = isPromptShown(next);
  next.prompt = showsPrompt ? (draft.prompt ?? values.prompt ?? '') : '';
  next.variables = showsPrompt ? syncPromptVariables(next.prompt, draft.variables ?? values.variables) : [];
  return next;
};

export const changedFields = (values, draft, lockedEntity) => {
  const drafted = draftToFormValues(draft, values, lockedEntity);
  return Object.keys(drafted)
    .filter(field => !isStructurallyEqual(drafted[field], values[field]))
    .map(field => ({ field, current: values[field], drafted: drafted[field] }));
};

export const isScheduleFormEmpty = ({ name, prompt, application_id, toolkit_id }) =>
  !name && !prompt && !application_id && !toolkit_id;
