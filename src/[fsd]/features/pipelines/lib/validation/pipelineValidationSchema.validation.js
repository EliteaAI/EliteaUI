import * as yup from 'yup';

import { MAX_NAME_LENGTH } from '@/common/constants';

// Description is optional for pipelines, matching the backend (elitea_core models/pd/application.py)
const PipelineValidateSchema = () =>
  yup.object({
    name: yup
      .string('Enter pipeline name')
      .trim()
      .required('Name is required')
      .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
    description: yup.string('Enter pipeline description').nullable(),
    version_details: yup.object({
      conversation_starters: yup.array().of(yup.string()),
    }),
  });

export default PipelineValidateSchema;
