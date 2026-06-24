import { MAX_DESCRIPTION_LENGTH, MAX_INSTRUCTIONS_LENGTH } from '@/common/constants.js';

const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export const validateSkillDraft = draft => {
  const errors = {};
  const name = (draft.name || '').trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length > SKILL_NAME_MAX_LENGTH)
    errors.name = `Name must be ${SKILL_NAME_MAX_LENGTH} characters or less`;
  else if (!SKILL_NAME_RE.test(name))
    errors.name = 'Name must be lowercase letters, digits and hyphens only, cannot start or end with a hyphen';
  else if (name.includes('claude') || name.includes('anthropic'))
    errors.name = 'Name cannot contain "claude" or "anthropic"';

  const description = (draft.description || '').trim();
  if (!description) errors.description = 'Description is required';
  else if (description.length > MAX_DESCRIPTION_LENGTH)
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;

  const instructions = (draft.instructions || '').trim();
  if (!instructions) errors.instructions = 'Instructions are required';
  else if (instructions.length > MAX_INSTRUCTIONS_LENGTH)
    errors.instructions = `Instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or less`;

  return errors;
};
