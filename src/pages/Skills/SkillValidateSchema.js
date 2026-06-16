import * as yup from 'yup';

import {
  MAX_SKILL_DESCRIPTION_LENGTH,
  MAX_SKILL_INSTRUCTIONS_LENGTH,
} from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import { MAX_NAME_LENGTH } from '@/common/constants';

// Shared validation for skill create + edit forms (mirrors the agents'
// co-located ApplicationCreationValidateSchema pattern).
const SkillValidateSchema = () =>
  yup.object({
    name: yup
      .string('Enter skill name')
      .trim()
      .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
      .required('Name is required'),
    description: yup
      .string('Enter skill description')
      .trim()
      .max(
        MAX_SKILL_DESCRIPTION_LENGTH,
        `Description must be at most ${MAX_SKILL_DESCRIPTION_LENGTH} characters`,
      )
      .required('Description is required'),
    version_details: yup.object({
      instructions: yup
        .string()
        .max(
          MAX_SKILL_INSTRUCTIONS_LENGTH,
          `Instructions must be at most ${MAX_SKILL_INSTRUCTIONS_LENGTH} characters`,
        ),
    }),
  });

export default SkillValidateSchema;
