import * as yup from 'yup';

import { instructionsTooLongMessage, isInstructionsOverLimit } from '@/[fsd]/features/skill/lib/helpers';
import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';

// Mirror the backend skill-name rule (elitea_core models/pd/skill.py
// validate_skill_name): lowercase letters/digits/hyphens, no leading/trailing
// hyphen, <= 64 chars, and must not contain "claude" or "anthropic". Kept in
// sync so invalid names surface as inline field errors instead of a 400 toast.
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const SPEC_DESCRIPTION_FORBIDDEN_CHARACTERS = /[<>]/;

const isUnchangedOrValid = (value, savedValue, isValid) =>
  !value || value === savedValue?.trim() || isValid(value);

const SkillValidateSchema = (maxInstructionsLength, savedInstructions, savedSkill = {}) =>
  yup.object({
    name: yup
      .string('Enter skill name')
      .trim()
      .required('Name is required')
      .max(SKILL_NAME_MAX_LENGTH, `Name must be at most ${SKILL_NAME_MAX_LENGTH} characters`)
      .matches(
        SKILL_NAME_RE,
        'Name must be lowercase letters, digits and hyphens only (no spaces), and cannot start or end with a hyphen',
      )
      .test('no-reserved-vendor', 'Name cannot contain "claude" or "anthropic"', value => {
        if (!value) return true;
        const v = value.toLowerCase();
        return !v.includes('claude') && !v.includes('anthropic');
      })
      .test('no-consecutive-hyphens', 'Name cannot contain consecutive hyphens (--)', value =>
        isUnchangedOrValid(value, savedSkill.name, name => !name.includes('--')),
      ),
    description: yup
      .string('Enter skill description')
      .trim()
      .max(MAX_DESCRIPTION_LENGTH, `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`)
      .test('no-angle-brackets', 'Description cannot contain angle brackets (< or >)', value =>
        isUnchangedOrValid(
          value,
          savedSkill.description,
          description => !SPEC_DESCRIPTION_FORBIDDEN_CHARACTERS.test(description),
        ),
      )
      .required('Description is required'),
    version_details: yup.object({
      instructions: yup
        .string()
        .trim()
        .test('instructions-max-length', (value, context) => {
          const rawValue = context.originalValue ?? '';
          if (!isInstructionsOverLimit(rawValue, maxInstructionsLength, savedInstructions)) return true;
          return context.createError({
            message: instructionsTooLongMessage(rawValue.length, maxInstructionsLength),
          });
        })
        .required('Instructions are required'),
    }),
  });

export default SkillValidateSchema;
