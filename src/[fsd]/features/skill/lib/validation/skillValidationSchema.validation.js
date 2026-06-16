import * as yup from 'yup';

import { MAX_DESCRIPTION_LENGTH, MAX_INSTRUCTIONS_LENGTH, MAX_NAME_LENGTH } from '@/common/constants';

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
      .max(MAX_DESCRIPTION_LENGTH, `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`)
      .required('Description is required'),
    version_details: yup.object({
      instructions: yup
        .string()
        .max(MAX_INSTRUCTIONS_LENGTH, `Instructions must be at most ${MAX_INSTRUCTIONS_LENGTH} characters`),
    }),
  });

export default SkillValidateSchema;
