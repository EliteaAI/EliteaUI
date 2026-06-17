import * as yup from 'yup';

import { MAX_DESCRIPTION_LENGTH, MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';

// Mirror the backend skill-name rule (elitea_core models/pd/skill.py
// validate_skill_name): lowercase letters/digits/hyphens, no leading/trailing
// hyphen, <= 64 chars, and must not contain "claude" or "anthropic". Kept in
// sync so invalid names surface as inline field errors instead of a 400 toast.
const SKILL_NAME_MAX_LENGTH = 64;
const SKILL_NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const SkillValidateSchema = () =>
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
      }),
    description: yup
      .string('Enter skill description')
      .trim()
      .max(MAX_DESCRIPTION_LENGTH, `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`)
      .required('Description is required'),
    version_details: yup.object({
      instructions: yup
        .string()
        .max(MAX_INSTRUCTIONS_LENGTH, `Instructions must be at most ${MAX_INSTRUCTIONS_LENGTH} characters`),
    }),
  });

export default SkillValidateSchema;
