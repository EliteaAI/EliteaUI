import { areStartersEqual, filterEmptyStarters } from './conversationStarters.helpers';

const isEditUnsaved = (value, savedValue) =>
  Array.isArray(value)
    ? !areStartersEqual(filterEmptyStarters(value), filterEmptyStarters(savedValue))
    : value !== savedValue;

/**
 * True when at least one edit differs from what is saved, so an edit reverted to the saved text is not unsaved.
 * An edit with no saved counterpart in `data` (for example a file whose text is not loaded into it) counts as unsaved.
 */
export const hasUnsavedEdits = (edits, data) =>
  Object.entries(edits ?? {}).some(([key, value]) => isEditUnsaved(value, data?.[key]));
