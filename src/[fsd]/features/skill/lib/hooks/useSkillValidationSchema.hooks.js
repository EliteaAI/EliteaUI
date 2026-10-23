import { useMemo } from 'react';

import { SkillValidateSchema } from '@/[fsd]/features/skill/lib/validation';

import { useSkillInstructionsMaxLength } from './useSkillInstructionsMaxLength.hooks';

export const useSkillValidationSchema = savedInstructions => {
  const maxInstructionsLength = useSkillInstructionsMaxLength();
  return useMemo(
    () => SkillValidateSchema(maxInstructionsLength, savedInstructions),
    [maxInstructionsLength, savedInstructions],
  );
};
